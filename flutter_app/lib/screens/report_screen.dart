import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geocoding/geocoding.dart';
import '../cubit/reports_cubit.dart';
import '../services/supabase_service.dart';
import '../widgets/gradient_background.dart';
import '../widgets/floating_header.dart';
import '../widgets/glass_card.dart';
import '../theme/app_theme.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  File? _image;
  LatLng? _location;
  String _address = 'Fetching location...';
  final TextEditingController _descriptionController = TextEditingController();
  bool _isLoading = false;
  bool _showMap = false;
  final MapController _mapController = MapController();
  final ImagePicker _picker = ImagePicker();
  final SupabaseService _supabaseService = SupabaseService();

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _location = const LatLng(12.9716, 77.5946);
          _address = 'Location services disabled';
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _location = LatLng(position.latitude, position.longitude);
      });

      await _updateAddress(position.latitude, position.longitude);
    } catch (e) {
      setState(() {
        _location = const LatLng(12.9716, 77.5946);
        _address = 'Could not get location';
      });
    }
  }

  Future<void> _updateAddress(double lat, double lng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(lat, lng);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        setState(() {
          _address =
              '${place.street ?? ''}, ${place.locality ?? ''}, ${place.administrativeArea ?? ''}';
        });
      }
    } catch (e) {
      setState(() {
        _address = 'Address not available';
      });
    }
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 50,
    );

    if (image != null) {
      setState(() {
        _image = File(image.path);
      });
    }
  }

  Future<void> _submitReport() async {
    if (_image == null || _location == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please take a photo and ensure location is fetched.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Upload image
      final imageUrl = await _supabaseService.uploadImage(_image!);

      // Submit report
      await _supabaseService.submitReport(
        imageUrl: imageUrl,
        latitude: _location!.latitude,
        longitude: _location!.longitude,
        address: _address,
        areaName: _address.split(',').first,
        description: _descriptionController.text.isNotEmpty
            ? _descriptionController.text
            : null,
      );

      // Refresh reports
      if (mounted) {
        context.read<ReportsCubit>().refreshReports();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report submitted successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        // Reset form
        setState(() {
          _image = null;
          _descriptionController.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return GradientBackground(
      child: Stack(
        children: [
          // Content
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 120, 16, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Report Pothole',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 20),

                // Image picker
                GestureDetector(
                  onTap: _pickImage,
                  child: GlassCard(
                    padding: EdgeInsets.zero,
                    child: Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDarkMode
                              ? Colors.grey.shade700
                              : Colors.grey.shade300,
                          width: 2,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: _image != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: Image.file(
                                _image!,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                height: double.infinity,
                              ),
                            )
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.camera_alt,
                                  size: 48,
                                  color: isDarkMode
                                      ? Colors.grey.shade400
                                      : Colors.grey.shade600,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Tap to take photo',
                                  style: TextStyle(
                                    color: isDarkMode
                                        ? Colors.grey.shade400
                                        : Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Location section
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Location',
                            style: TextStyle(
                              fontWeight: FontWeight.w500,
                              color: isDarkMode
                                  ? Colors.grey.shade400
                                  : Colors.grey.shade600,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => setState(() => _showMap = true),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.location_on,
                                  size: 16,
                                  color: AppTheme.primaryBlue,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Adjust on Map',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryBlue,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _address,
                        style: TextStyle(
                          color: isDarkMode ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Description
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Description',
                        style: TextStyle(
                          fontWeight: FontWeight.w500,
                          color: isDarkMode
                              ? Colors.grey.shade400
                              : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _descriptionController,
                        maxLines: 3,
                        style: TextStyle(
                          color: isDarkMode ? Colors.white : Colors.black87,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Describe the pothole...',
                          hintStyle: TextStyle(
                            color: isDarkMode
                                ? Colors.grey.shade500
                                : Colors.grey.shade400,
                          ),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Submit button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitReport,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppTheme.primaryBlue,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Submit Report',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),

          // Floating Header
          const Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: FloatingHeader(),
          ),

          // Map Modal
          if (_showMap) _buildMapModal(isDarkMode),
        ],
      ),
    );
  }

  Widget _buildMapModal(bool isDarkMode) {
    return Container(
      color: isDarkMode ? AppTheme.darkBackground : Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDarkMode ? AppTheme.darkSurface : Colors.white,
                border: Border(
                  bottom: BorderSide(
                    color:
                        isDarkMode ? Colors.grey.shade800 : Colors.grey.shade200,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Pick Location',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDarkMode ? Colors.white : Colors.black87,
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _showMap = false),
                    child: Text(
                      'Done',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Map
            Expanded(
              child: Stack(
                children: [
                  FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: _location ?? const LatLng(12.9716, 77.5946),
                      initialZoom: 15,
                      onTap: (tapPosition, point) {
                        setState(() {
                          _location = point;
                        });
                        _updateAddress(point.latitude, point.longitude);
                      },
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: isDarkMode
                            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                        subdomains: const ['a', 'b', 'c'],
                      ),
                      if (_location != null)
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: _location!,
                              width: 40,
                              height: 40,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryBlue,
                                  shape: BoxShape.circle,
                                  border:
                                      Border.all(color: Colors.white, width: 3),
                                ),
                                child: const Icon(
                                  Icons.location_on,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),

                  // Bottom hint
                  Positioned(
                    bottom: 20,
                    left: 16,
                    right: 16,
                    child: GlassCard(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        'Tap on the map to move the pin',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDarkMode
                              ? Colors.grey.shade400
                              : Colors.grey.shade600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }
}
