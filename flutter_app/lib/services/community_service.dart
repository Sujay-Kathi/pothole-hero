import 'package:supabase_flutter/supabase_flutter.dart';
import 'device_service.dart';

class CommunityService {
  static final CommunityService _instance = CommunityService._internal();
  factory CommunityService() => _instance;
  CommunityService._internal();

  final SupabaseClient _client = Supabase.instance.client;
  final DeviceService _deviceService = DeviceService();

  // ============================================
  // UPVOTES
  // ============================================

  // Check if user has upvoted a report
  Future<bool> hasUpvoted(String reportId) async {
    final deviceId = await _deviceService.getDeviceId();
    try {
      final response = await _client
          .from('upvotes')
          .select('id')
          .eq('report_id', int.parse(reportId))
          .eq('device_id', deviceId)
          .maybeSingle();
      return response != null;
    } catch (e) {
      return false;
    }
  }

  // Toggle upvote
  Future<bool> toggleUpvote(String reportId) async {
    final deviceId = await _deviceService.getDeviceId();
    final reportIdInt = int.parse(reportId);
    
    try {
      final hasVoted = await hasUpvoted(reportId);
      
      if (hasVoted) {
        // Remove upvote
        await _client
            .from('upvotes')
            .delete()
            .eq('report_id', reportIdInt)
            .eq('device_id', deviceId);
        
        // Decrement count
        await _client.rpc('decrement_upvote_count', params: {'p_report_id': reportIdInt});
        
        return false;
      } else {
        // Add upvote
        await _client.from('upvotes').insert({
          'report_id': reportIdInt,
          'device_id': deviceId,
        });
        
        // Increment count
        await _client.rpc('increment_upvote_count', params: {'p_report_id': reportIdInt});
        
        // Add points to user
        await _deviceService.addPoints(5, reason: 'upvote');
        
        return true;
      }
    } catch (e) {
      // Fallback: try to update count directly
      try {
        if (await hasUpvoted(reportId)) {
          await _client.from('upvotes').delete()
              .eq('report_id', reportIdInt)
              .eq('device_id', deviceId);
        } else {
          await _client.from('upvotes').insert({
            'report_id': reportIdInt,
            'device_id': deviceId,
          });
        }
      } catch (_) {}
      return false;
    }
  }

  // Get upvote count for a report
  Future<int> getUpvoteCount(String reportId) async {
    try {
      final response = await _client
          .from('upvotes')
          .select('id')
          .eq('report_id', int.parse(reportId));
      return (response as List).length;
    } catch (e) {
      return 0;
    }
  }

  // ============================================
  // COMMENTS
  // ============================================

  // Get comments for a report
  Future<List<Map<String, dynamic>>> getComments(String reportId) async {
    try {
      final response = await _client
          .from('pothole_comments')
          .select('*, device_users(nickname)')
          .eq('report_id', int.parse(reportId))
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      // Fallback without join
      try {
        final response = await _client
            .from('pothole_comments')
            .select()
            .eq('report_id', int.parse(reportId))
            .order('created_at', ascending: false);
        return List<Map<String, dynamic>>.from(response);
      } catch (_) {
        return [];
      }
    }
  }

  // Add a comment
  Future<bool> addComment(String reportId, String content) async {
    if (content.trim().isEmpty) return false;
    
    final deviceId = await _deviceService.getDeviceId();
    
    try {
      await _client.from('pothole_comments').insert({
        'report_id': int.parse(reportId),
        'device_id': deviceId,
        'content': content.trim(),
      });
      
      // Add points for commenting
      await _deviceService.addPoints(3, reason: 'comment');
      
      return true;
    } catch (e) {
      return false;
    }
  }

  // Delete a comment (only own comments)
  Future<bool> deleteComment(String commentId) async {
    final deviceId = await _deviceService.getDeviceId();
    
    try {
      await _client
          .from('pothole_comments')
          .delete()
          .eq('id', commentId)
          .eq('device_id', deviceId);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Get comment count for a report
  Future<int> getCommentCount(String reportId) async {
    try {
      final response = await _client
          .from('pothole_comments')
          .select('id')
          .eq('report_id', int.parse(reportId));
      return (response as List).length;
    } catch (e) {
      return 0;
    }
  }

  // ============================================
  // WATCHERS (Watch/Follow feature)
  // ============================================

  // Check if user is watching a report
  Future<bool> isWatching(String reportId) async {
    final deviceId = await _deviceService.getDeviceId();
    try {
      final response = await _client
          .from('watchers')
          .select('id')
          .eq('report_id', int.parse(reportId))
          .eq('device_id', deviceId)
          .maybeSingle();
      return response != null;
    } catch (e) {
      return false;
    }
  }

  // Toggle watch status
  Future<bool> toggleWatch(String reportId) async {
    final deviceId = await _deviceService.getDeviceId();
    final reportIdInt = int.parse(reportId);
    
    try {
      final watching = await isWatching(reportId);
      
      if (watching) {
        // Stop watching
        await _client
            .from('watchers')
            .delete()
            .eq('report_id', reportIdInt)
            .eq('device_id', deviceId);
        return false;
      } else {
        // Start watching
        await _client.from('watchers').insert({
          'report_id': reportIdInt,
          'device_id': deviceId,
        });
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  // Get reports user is watching
  Future<List<int>> getWatchedReportIds() async {
    final deviceId = await _deviceService.getDeviceId();
    try {
      final response = await _client
          .from('watchers')
          .select('report_id')
          .eq('device_id', deviceId);
      return (response as List).map((e) => e['report_id'] as int).toList();
    } catch (e) {
      return [];
    }
  }

  // Get watcher count for a report
  Future<int> getWatcherCount(String reportId) async {
    try {
      final response = await _client
          .from('watchers')
          .select('id')
          .eq('report_id', int.parse(reportId));
      return (response as List).length;
    } catch (e) {
      return 0;
    }
  }

  // ============================================
  // SHARE TRACKING
  // ============================================

  // Increment share count
  Future<void> incrementShareCount(String reportId) async {
    try {
      final reportIdInt = int.parse(reportId);
      
      // Get current count
      final response = await _client
          .from('pothole_reports')
          .select('share_count')
          .eq('id', reportIdInt)
          .single();
      
      final currentCount = (response['share_count'] ?? 0) as int;
      
      await _client
          .from('pothole_reports')
          .update({'share_count': currentCount + 1})
          .eq('id', reportIdInt);
      
      // Add points for sharing
      await _deviceService.addPoints(2, reason: 'share');
    } catch (e) {
      // Ignore errors
    }
  }
}
