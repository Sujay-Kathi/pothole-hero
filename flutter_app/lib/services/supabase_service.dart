import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/pothole_report.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;

  // Fetch all pothole reports
  Future<List<PotholeReport>> fetchReports() async {
    try {
      final response = await _client
          .from('pothole_reports')
          .select()
          .order('created_at', ascending: false);

      return (response as List)
          .map((json) => PotholeReport.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch reports: $e');
    }
  }

  // Upload image to storage
  Future<String> uploadImage(File imageFile) async {
    try {
      final fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
      final bytes = await imageFile.readAsBytes();

      await _client.storage.from('pothole-images').uploadBinary(
            fileName,
            bytes,
            fileOptions: const FileOptions(contentType: 'image/jpeg'),
          );

      final publicUrl =
          _client.storage.from('pothole-images').getPublicUrl(fileName);

      return publicUrl;
    } catch (e) {
      throw Exception('Failed to upload image: $e');
    }
  }

  // Submit a new pothole report
  Future<void> submitReport({
    required String imageUrl,
    required double latitude,
    required double longitude,
    required String address,
    required String areaName,
    required String duration,
    String? description,
    String? deviceId,
    String severity = 'medium',
  }) async {
    try {
      await _client.from('pothole_reports').insert({
        'image_url': imageUrl,
        'latitude': latitude,
        'longitude': longitude,
        'address': address,
        'area_name': areaName,
        'description': description,
        'duration': duration,
        'status': 'pending',
        'device_id': deviceId,
        'severity': severity,
      });
    } catch (e) {
      throw Exception('Failed to submit report: $e');
    }
  }

  // Get report count
  Future<int> getReportCount() async {
    try {
      final response = await _client
          .from('pothole_reports')
          .select('id')
          .count(CountOption.exact);
      return response.count ?? 0;
    } catch (e) {
      return 0;
    }
  }

  // Delete a report (Admin only)
  Future<void> deleteReport(String reportId) async {
    try {
      debugPrint('🗑️ Attempting to delete report with ID: $reportId');
      
      // Try to parse as int first (for integer primary keys)
      final intId = int.tryParse(reportId);
      debugPrint('🔢 Parsed intId: $intId');
      
      if (intId != null) {
        final response = await _client.from('pothole_reports').delete().eq('id', intId).select();
        debugPrint('✅ Delete response: $response');
      } else {
        // Fall back to string (for UUID primary keys)
        final response = await _client.from('pothole_reports').delete().eq('id', reportId).select();
        debugPrint('✅ Delete response (UUID): $response');
      }
      debugPrint('🎉 Delete operation completed');
    } catch (e) {
      debugPrint('❌ Delete failed: $e');
      throw Exception('Failed to delete report: $e');
    }
  }

  // Update report status (Admin only)
  Future<void> updateReportStatus(String reportId, String status) async {
    try {
      debugPrint('✏️ Attempting to update report $reportId to status: $status');
      
      // Try to parse as int first (for integer primary keys)
      final intId = int.tryParse(reportId);
      debugPrint('🔢 Parsed intId: $intId');
      
      if (intId != null) {
        final response = await _client.from('pothole_reports').update({
          'status': status,
        }).eq('id', intId).select();
        debugPrint('✅ Update response: $response');
      } else {
        // Fall back to string (for UUID primary keys)
        final response = await _client.from('pothole_reports').update({
          'status': status,
        }).eq('id', reportId).select();
        debugPrint('✅ Update response (UUID): $response');
      }
      debugPrint('🎉 Update operation completed');
    } catch (e) {
      debugPrint('❌ Update failed: $e');
      throw Exception('Failed to update report status: $e');
    }
  }

  // ============ PHASE 1: UPVOTE SYSTEM ============

  // Toggle upvote for a report (upvote if not upvoted, remove if already upvoted)
  Future<bool> toggleUpvote(String reportId, String deviceId) async {
    try {
      final intId = int.tryParse(reportId);
      
      // Check if already upvoted
      final existingUpvote = await _client
          .from('pothole_upvotes')
          .select()
          .eq('report_id', intId ?? reportId)
          .eq('device_id', deviceId)
          .maybeSingle();
      
      if (existingUpvote != null) {
        // Remove upvote
        await _client
            .from('pothole_upvotes')
            .delete()
            .eq('report_id', intId ?? reportId)
            .eq('device_id', deviceId);
        
        // Decrement upvote count
        await _updateUpvoteCount(reportId, -1);
        debugPrint('👎 Removed upvote for report $reportId');
        return false;
      } else {
        // Add upvote
        await _client.from('pothole_upvotes').insert({
          'report_id': intId ?? reportId,
          'device_id': deviceId,
        });
        
        // Increment upvote count
        await _updateUpvoteCount(reportId, 1);
        debugPrint('👍 Added upvote for report $reportId');
        return true;
      }
    } catch (e) {
      debugPrint('❌ Upvote toggle failed: $e');
      throw Exception('Failed to toggle upvote: $e');
    }
  }

  // Update upvote count on the report
  Future<void> _updateUpvoteCount(String reportId, int delta) async {
    try {
      final intId = int.tryParse(reportId);
      
      // Get current count
      final report = await _client
          .from('pothole_reports')
          .select('upvote_count')
          .eq('id', intId ?? reportId)
          .single();
      
      final currentCount = report['upvote_count'] ?? 0;
      final newCount = (currentCount + delta).clamp(0, 999999);
      
      await _client
          .from('pothole_reports')
          .update({'upvote_count': newCount})
          .eq('id', intId ?? reportId);
    } catch (e) {
      debugPrint('Failed to update upvote count: $e');
    }
  }

  // Check if user has upvoted a report
  Future<bool> hasUpvoted(String reportId, String deviceId) async {
    try {
      final intId = int.tryParse(reportId);
      
      final result = await _client
          .from('pothole_upvotes')
          .select('id')
          .eq('report_id', intId ?? reportId)
          .eq('device_id', deviceId)
          .maybeSingle();
      
      return result != null;
    } catch (e) {
      debugPrint('Failed to check upvote status: $e');
      return false;
    }
  }

  // Get upvote status for multiple reports at once
  Future<Map<String, bool>> getUpvoteStatusBatch(List<String> reportIds, String deviceId) async {
    try {
      final intIds = reportIds.map((id) => int.tryParse(id) ?? id).toList();
      
      final results = await _client
          .from('pothole_upvotes')
          .select('report_id')
          .inFilter('report_id', intIds)
          .eq('device_id', deviceId);
      
      final upvotedIds = (results as List).map((r) => r['report_id'].toString()).toSet();
      
      return {
        for (var id in reportIds) id: upvotedIds.contains(id)
      };
    } catch (e) {
      debugPrint('Failed to get batch upvote status: $e');
      return {};
    }
  }

  // ============ PHASE 1: DUPLICATE DETECTION ============

  // Find nearby reports within specified radius (in meters)
  Future<List<PotholeReport>> findNearbyReports(
    double latitude,
    double longitude, {
    double radiusMeters = 50,
  }) async {
    try {
      // Approximate degree conversion (1 degree ≈ 111km at equator)
      final radiusDegrees = radiusMeters / 111000;
      
      final minLat = latitude - radiusDegrees;
      final maxLat = latitude + radiusDegrees;
      final minLon = longitude - radiusDegrees;
      final maxLon = longitude + radiusDegrees;
      
      final response = await _client
          .from('pothole_reports')
          .select()
          .gte('latitude', minLat)
          .lte('latitude', maxLat)
          .gte('longitude', minLon)
          .lte('longitude', maxLon)
          .order('upvote_count', ascending: false);
      
      return (response as List)
          .map((json) => PotholeReport.fromJson(json))
          .toList();
    } catch (e) {
      debugPrint('Failed to find nearby reports: $e');
      return [];
    }
  }

  // Check for duplicates and return the primary report if found
  Future<PotholeReport?> checkForDuplicate(double latitude, double longitude) async {
    final nearbyReports = await findNearbyReports(latitude, longitude, radiusMeters: 50);
    
    if (nearbyReports.isEmpty) {
      return null;
    }
    
    // Return the report with highest upvotes (primary report)
    return nearbyReports.first;
  }

  // Link a new report to an existing one (for duplicate handling)
  Future<void> linkToExistingReport(String existingReportId, String deviceId) async {
    try {
      final intId = int.tryParse(existingReportId);
      
      // Just upvote the existing report instead of creating a duplicate
      final hasAlreadyUpvoted = await hasUpvoted(existingReportId, deviceId);
      if (!hasAlreadyUpvoted) {
        await toggleUpvote(existingReportId, deviceId);
      }
      
      debugPrint('🔗 Linked device $deviceId to existing report $existingReportId');
    } catch (e) {
      debugPrint('Failed to link report: $e');
    }
  }

  // Get count of people who reported this location
  Future<int> getReportersCount(String reportId) async {
    try {
      final intId = int.tryParse(reportId);
      
      final result = await _client
          .from('pothole_upvotes')
          .select('id')
          .eq('report_id', intId ?? reportId)
          .count(CountOption.exact);
      
      // Add 1 for the original reporter
      return (result.count ?? 0) + 1;
    } catch (e) {
      debugPrint('Failed to get reporters count: $e');
      return 1;
    }
  }

  // ============ ADMIN AUTHENTICATION ============

  /// Verify admin credentials against the database
  /// Returns true if credentials are valid, false otherwise
  Future<bool> verifyAdminCredentials(String username, String password) async {
    try {
      debugPrint('🔐 Verifying admin credentials for: $username');
      
      final response = await _client
          .from('admin_credentials')
          .select('password')
          .eq('username', username)
          .eq('is_active', true)
          .maybeSingle();
      
      if (response == null) {
        debugPrint('❌ Admin user not found: $username');
        return false;
      }
      
      final storedPassword = response['password'] as String;
      final isValid = storedPassword == password;
      
      debugPrint(isValid ? '✅ Admin login successful' : '❌ Invalid password');
      return isValid;
    } catch (e) {
      debugPrint('❌ Admin verification failed: $e');
      return false;
    }
  }
}

