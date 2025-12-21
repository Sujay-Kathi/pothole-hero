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
}
