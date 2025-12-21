import 'package:equatable/equatable.dart';

class PotholeReport extends Equatable {
  final String id;
  final String imageUrl;
  final double latitude;
  final double longitude;
  final String? address;
  final String? areaName;
  final String? description;
  final String? duration;
  final String status;
  final DateTime createdAt;
  
  // New gamification/community fields
  final String? deviceId;
  final String severity; // 'low', 'medium', 'high', 'critical'
  final int upvoteCount;
  final int commentCount;
  final int shareCount;

  const PotholeReport({
    required this.id,
    required this.imageUrl,
    required this.latitude,
    required this.longitude,
    this.address,
    this.areaName,
    this.description,
    this.duration,
    required this.status,
    required this.createdAt,
    this.deviceId,
    this.severity = 'medium',
    this.upvoteCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
  });

  factory PotholeReport.fromJson(Map<String, dynamic> json) {
    return PotholeReport(
      id: json['id'].toString(),
      imageUrl: json['image_url'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      address: json['address'],
      areaName: json['area_name'],
      description: json['description'],
      duration: json['duration'],
      status: json['status'] ?? 'pending',
      createdAt: DateTime.parse(json['created_at']),
      deviceId: json['device_id'],
      severity: json['severity'] ?? 'medium',
      upvoteCount: json['upvote_count'] ?? 0,
      commentCount: json['comment_count'] ?? 0,
      shareCount: json['share_count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'image_url': imageUrl,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'area_name': areaName,
      'description': description,
      'duration': duration,
      'status': status,
      'device_id': deviceId,
      'severity': severity,
    };
  }

  // Check if user has upvoted this report
  bool isOwnReport(String? currentDeviceId) {
    return deviceId != null && deviceId == currentDeviceId;
  }

  @override
  List<Object?> get props => [id, imageUrl, latitude, longitude, status, upvoteCount];
}

