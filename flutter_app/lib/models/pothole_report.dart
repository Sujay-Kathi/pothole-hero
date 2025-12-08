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
    };
  }

  @override
  List<Object?> get props => [id, imageUrl, latitude, longitude, status];
}
