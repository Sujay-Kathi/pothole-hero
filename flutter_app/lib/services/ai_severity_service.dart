import 'dart:io';
import 'dart:ui' show Color;
import 'package:google_mlkit_image_labeling/google_mlkit_image_labeling.dart';
import 'package:flutter/foundation.dart';

class AISeverityService {
  static final AISeverityService _instance = AISeverityService._internal();
  factory AISeverityService() => _instance;
  AISeverityService._internal();

  ImageLabeler? _imageLabeler;

  // Initialize the image labeler
  Future<void> initialize() async {
    if (_imageLabeler == null) {
      final options = ImageLabelerOptions(confidenceThreshold: 0.5);
      _imageLabeler = ImageLabeler(options: options);
    }
  }

  // Analyze pothole severity from image
  Future<SeverityResult> analyzeSeverity(File imageFile) async {
    try {
      await initialize();
      
      final inputImage = InputImage.fromFile(imageFile);
      final labels = await _imageLabeler!.processImage(inputImage);
      
      debugPrint('🔍 ML Kit detected ${labels.length} labels');
      for (final label in labels) {
        debugPrint('  - ${label.label}: ${(label.confidence * 100).toStringAsFixed(1)}%');
      }

      // Analyze labels to determine severity
      final severity = _determineSeverity(labels);
      
      return severity;
    } catch (e) {
      debugPrint('❌ AI Severity analysis error: $e');
      return SeverityResult(
        severity: 'medium',
        confidence: 0.0,
        details: 'Unable to analyze image',
        labels: [],
      );
    }
  }

  // Determine severity based on detected labels
  SeverityResult _determineSeverity(List<ImageLabel> labels) {
    // Keywords that might indicate severity
    const criticalKeywords = ['hole', 'damage', 'crack', 'broken', 'debris', 'danger', 'hazard'];
    const highKeywords = ['road', 'asphalt', 'ground', 'pavement', 'surface'];
    const mediumKeywords = ['street', 'path', 'floor'];
    
    int criticalScore = 0;
    int highScore = 0;
    int mediumScore = 0;
    double maxConfidence = 0.0;
    
    final detectedLabels = <String>[];
    
    for (final label in labels) {
      final labelLower = label.label.toLowerCase();
      detectedLabels.add('${label.label} (${(label.confidence * 100).toInt()}%)');
      
      if (label.confidence > maxConfidence) {
        maxConfidence = label.confidence;
      }
      
      for (final keyword in criticalKeywords) {
        if (labelLower.contains(keyword)) {
          criticalScore += (label.confidence * 100).toInt();
        }
      }
      
      for (final keyword in highKeywords) {
        if (labelLower.contains(keyword)) {
          highScore += (label.confidence * 100).toInt();
        }
      }
      
      for (final keyword in mediumKeywords) {
        if (labelLower.contains(keyword)) {
          mediumScore += (label.confidence * 100).toInt();
        }
      }
    }

    // Determine severity based on scores
    String severity;
    String details;
    
    if (criticalScore > 50) {
      severity = 'critical';
      details = 'Severe damage detected - immediate attention needed';
    } else if (criticalScore > 20 || highScore > 80) {
      severity = 'high';
      details = 'Significant road damage detected';
    } else if (highScore > 40 || mediumScore > 50) {
      severity = 'medium';
      details = 'Moderate road issue detected';
    } else {
      severity = 'low';
      details = 'Minor road issue or unclear image';
    }

    return SeverityResult(
      severity: severity,
      confidence: maxConfidence,
      details: details,
      labels: detectedLabels,
    );
  }

  // Check for potential duplicate based on location proximity
  bool isPotentialDuplicate({
    required double lat1,
    required double lon1,
    required double lat2,
    required double lon2,
    double thresholdMeters = 50,
  }) {
    // Haversine formula to calculate distance
    const earthRadius = 6371000; // meters
    
    final dLat = _toRadians(lat2 - lat1);
    final dLon = _toRadians(lon2 - lon1);
    
    final a = _sin(dLat / 2) * _sin(dLat / 2) +
              _cos(_toRadians(lat1)) * _cos(_toRadians(lat2)) *
              _sin(dLon / 2) * _sin(dLon / 2);
    
    final c = 2 * _atan2(_sqrt(a), _sqrt(1 - a));
    final distance = earthRadius * c;
    
    return distance <= thresholdMeters;
  }

  double _toRadians(double degrees) => degrees * 3.14159265359 / 180;
  double _sin(double x) => x - (x * x * x) / 6 + (x * x * x * x * x) / 120;
  double _cos(double x) => 1 - (x * x) / 2 + (x * x * x * x) / 24;
  double _sqrt(double x) => x >= 0 ? _newtonSqrt(x) : 0;
  double _newtonSqrt(double x) {
    if (x == 0) return 0;
    double guess = x / 2;
    for (int i = 0; i < 10; i++) {
      guess = (guess + x / guess) / 2;
    }
    return guess;
  }
  double _atan2(double y, double x) {
    if (x > 0) return _atan(y / x);
    if (x < 0 && y >= 0) return _atan(y / x) + 3.14159265359;
    if (x < 0 && y < 0) return _atan(y / x) - 3.14159265359;
    if (x == 0 && y > 0) return 3.14159265359 / 2;
    if (x == 0 && y < 0) return -3.14159265359 / 2;
    return 0;
  }
  double _atan(double x) => x - (x * x * x) / 3 + (x * x * x * x * x) / 5;

  // Get severity color
  static Color getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return const Color(0xFFE53935); // Red
      case 'high':
        return const Color(0xFFFF9800); // Orange
      case 'medium':
        return const Color(0xFFFFC107); // Amber
      case 'low':
        return const Color(0xFF4CAF50); // Green
      default:
        return const Color(0xFF9E9E9E); // Grey
    }
  }

  // Get severity icon
  static String getSeverityEmoji(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return '✅';
      default:
        return '❓';
    }
  }

  // Dispose resources
  Future<void> dispose() async {
    await _imageLabeler?.close();
    _imageLabeler = null;
  }
}

class SeverityResult {
  final String severity;
  final double confidence;
  final String details;
  final List<String> labels;

  SeverityResult({
    required this.severity,
    required this.confidence,
    required this.details,
    required this.labels,
  });

  @override
  String toString() {
    return 'SeverityResult(severity: $severity, confidence: ${(confidence * 100).toStringAsFixed(1)}%, details: $details)';
  }
}
