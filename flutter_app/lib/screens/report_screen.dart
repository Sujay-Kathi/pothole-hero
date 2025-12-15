import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geocoding/geocoding.dart';
import 'package:url_launcher/url_launcher.dart';
import '../cubit/reports_cubit.dart';
import '../cubit/theme_cubit.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  File? _image;
  LatLng? _location;
  // Removed _address string in favor of controller
  final TextEditingController _addressController = TextEditingController(text: 'Fetching location...');
  final TextEditingController _areaNameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  String? _duration;
  
  final List<String> _durationOptions = [
    'Less than a week',
    '1-2 weeks',
    '2-4 weeks',
    '1-3 months',
    '3-6 months',
    'More than 6 months',
  ];
  bool _isLoading = false;
  bool _showMap = false;
  
  // Search state
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _searchResults = [];
  bool _isSearching = false;
  bool _showSearchResults = false;

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
          _addressController.text = 'Location services disabled';
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
        _addressController.text = 'Could not get location';
      });
    }
  }

  Future<void> _updateAddress(double lat, double lng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(lat, lng);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        
        // Build a comprehensive address from all available fields
        List<String> addressParts = [];
        
        // Add name if available and different from street
        if (place.name != null && place.name!.isNotEmpty && place.name != place.street) {
          addressParts.add(place.name!);
        }
        
        // Add street number + street name (thoroughfare)
        if (place.subThoroughfare != null && place.subThoroughfare!.isNotEmpty) {
          addressParts.add(place.subThoroughfare!);
        }
        if (place.thoroughfare != null && place.thoroughfare!.isNotEmpty) {
          addressParts.add(place.thoroughfare!);
        } else if (place.street != null && place.street!.isNotEmpty) {
          addressParts.add(place.street!);
        }
        
        // Add sub-locality (neighborhood/area)
        if (place.subLocality != null && place.subLocality!.isNotEmpty) {
          addressParts.add(place.subLocality!);
        }
        
        // Add locality (city)
        if (place.locality != null && place.locality!.isNotEmpty) {
          addressParts.add(place.locality!);
        }
        
        // Add sub-administrative area (district)
        if (place.subAdministrativeArea != null && place.subAdministrativeArea!.isNotEmpty) {
          addressParts.add(place.subAdministrativeArea!);
        }
        
        // Add administrative area (state)
        if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) {
          addressParts.add(place.administrativeArea!);
        }
        
        // Add postal code
        if (place.postalCode != null && place.postalCode!.isNotEmpty) {
          addressParts.add(place.postalCode!);
        }
        
        // Remove duplicates while preserving order
        List<String> uniqueParts = [];
        for (var part in addressParts) {
          if (!uniqueParts.contains(part)) {
            uniqueParts.add(part);
          }
        }
        
        final fullAddress = uniqueParts.join(', ');
        
        // Determine area name (prefer subLocality, then locality)
        String areaName = place.subLocality ?? place.locality ?? place.subAdministrativeArea ?? '';
        
        debugPrint('Geocoding result: $fullAddress');
        debugPrint('Placemark details: name=${place.name}, street=${place.street}, thoroughfare=${place.thoroughfare}, subLocality=${place.subLocality}, locality=${place.locality}');
        
        setState(() {
          _addressController.text = fullAddress.isNotEmpty ? fullAddress : 'Address not found';
          _areaNameController.text = areaName;
        });
      } else {
        setState(() {
          _addressController.text = 'No address found for this location';
        });
      }
    } catch (e) {
      debugPrint('Geocoding error: $e');
      setState(() {
        _addressController.text = 'Address not available';
      });
    }
  }

  // --- Search Functionality ---

  Future<void> _searchLocation(String query) async {
    if (query.length < 3) {
      setState(() {
        _searchResults = [];
        _showSearchResults = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    try {
      // Restrict search to Bengaluru bbox roughly
      const minLon = 77.3;
      const minLat = 12.8;
      const maxLon = 77.9;
      const maxLat = 13.3;

      final lat = _location?.latitude ?? 12.9716;
      final lon = _location?.longitude ?? 77.5946;

      final response = await http.get(Uri.parse(
        'https://photon.komoot.io/api/?q=${Uri.encodeComponent(query)}&lat=$lat&lon=$lon&bbox=$minLon,$minLat,$maxLon,$maxLat&limit=8&lang=en',
      ));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final features = data['features'] as List;

        setState(() {
          _searchResults = features.map((f) {
            final props = f['properties'] as Map<String, dynamic>;
            final coords = f['geometry']['coordinates'] as List;
            return {
              'name': props['name'] ?? 'Unknown',
              'city': props['city'] ?? props['county'] ?? '',
              'state': props['state'] ?? '',
              'lat': coords[1],
              'lon': coords[0],
            };
          }).toList();
          _showSearchResults = true;
        });
      }
    } catch (e) {
      debugPrint('Search error: $e');
    } finally {
      setState(() => _isSearching = false);
    }
  }

  void _selectLocation(Map<String, dynamic> location) {
    final lat = location['lat'] as double;
    final lon = location['lon'] as double;
    final point = LatLng(lat, lon);
    
    _mapController.move(point, 16);
    
    setState(() {
      _location = point;
      _searchController.text = location['name'];
      _showSearchResults = false;
      FocusScope.of(context).unfocus();
    });
    
    _updateAddress(lat, lon);
  }

  // --------------------------

  Future<void> _showImagePicker() async {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: (isDarkMode ? const Color(0xFF1a1a2e) : Colors.white).withOpacity(0.9),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 50,
                  height: 5,
                  decoration: BoxDecoration(
                    color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  'Add Photo',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 28),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildPickerOption(
                      icon: Icons.camera_alt_rounded,
                      label: 'Camera',
                      onTap: () => _captureImage(ImageSource.camera),
                      isDarkMode: isDarkMode,
                    ),
                    _buildPickerOption(
                      icon: Icons.photo_library_rounded,
                      label: 'Gallery',
                      onTap: () => _captureImage(ImageSource.gallery),
                      isDarkMode: isDarkMode,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPickerOption({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool isDarkMode,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF667eea), Color(0xFF764ba2)],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF667eea).withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Icon(icon, size: 36, color: Colors.white),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: isDarkMode ? Colors.white : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _captureImage(ImageSource source) async {
    Navigator.pop(context);
    final XFile? image = await _picker.pickImage(
      source: source,
      imageQuality: 70,
    );

    if (image != null) {
      setState(() {
        _image = File(image.path);
      });
    }
  }

  Future<void> _submitReportFlow() async {
    if (_image == null || _location == null) {
      _showSnackBar('Please take a photo and ensure location is fetched.', isError: true);
      return;
    }

    if (_duration == null) {
      _showSnackBar('Please select how long the pothole has existed.', isError: true);
      return;
    }

    if (_areaNameController.text.isEmpty) {
      _showSnackBar('Please enter the Area Name.', isError: true);
      return;
    }

    setState(() => _isLoading = true);

    try {
      // 1. Upload Image First
      final imageUrl = await _supabaseService.uploadImage(_image!);

      if (!mounted) return;

      // 2. Launch Email
      await _launchEmail(imageUrl);

      // 3. Show Confirmation Dialog
      setState(() => _isLoading = false);
      _showEmailConfirmationDialog(imageUrl);

    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        _showSnackBar('Error: ${e.toString()}', isError: true);
      }
    }
  }

  void _showEmailConfirmationDialog(String imageUrl) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Did you send the email?'),
        content: const Text('To complete the report, please confirm that you have sent the email to BBMP.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
            },
            child: const Text('Not yet'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              await _finalizeSubmission(imageUrl);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF667eea),
              foregroundColor: Colors.white,
            ),
            child: const Text('Yes, I sent it'),
          ),
        ],
      ),
    );
  }

  Future<void> _finalizeSubmission(String imageUrl) async {
    setState(() => _isLoading = true);
    try {
      await _supabaseService.submitReport(
        imageUrl: imageUrl,
        latitude: _location!.latitude,
        longitude: _location!.longitude,
        address: _addressController.text,
        areaName: _areaNameController.text,
        duration: _duration!,
        description: _descriptionController.text.isNotEmpty ? _descriptionController.text : null,
      );

      if (mounted) {
        context.read<ReportsCubit>().refreshReports();
        _showSnackBar('Report submitted successfully! 🎉');
        
        // Reset form
        setState(() {
          _image = null;
          _descriptionController.clear();
          _areaNameController.clear();
          _duration = null;
        });

        // Navigate to dashboard
        Navigator.pop(context); // Alternatively, you might want to switch tabs if using a TabController
      }
    } catch (e) {
       if (mounted) _showSnackBar('Error saving report: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _launchEmail(String imageUrl) async {
    final subject = 'Pothole Reported: ${_areaNameController.text} - ${_addressController.text}';
    final body = '''
Dear BBMP Team,

I hope this message finds you well. I'm reaching out as a concerned citizen of Bangalore who cares deeply about the safety and well-being of our community.

I've encountered a pothole that has been causing significant concern for commuters in our area, and I believe it requires your urgent attention.

📍 Location Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Area: ${_areaNameController.text}
• Address: ${_addressController.text}
• GPS Coordinates: ${_location!.latitude}, ${_location!.longitude}
• Duration: $_duration

📝 Additional Observations:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${_descriptionController.text}

📸 Photo Evidence:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$imageUrl

I've attached a photo so you can see the severity of the situation. This pothole is a genuine safety hazard.
Our community would be incredibly grateful for your prompt action.

Thank you,
A Concerned Citizen of Bangalore
''';

    Uri emailLaunchUri;

    if (Platform.isAndroid || Platform.isIOS) {
      // Mobile: Use standard mailto scheme to open default email app
      emailLaunchUri = Uri(
        scheme: 'mailto',
        path: 'comm@bbmp.gov.in',
        query: 'subject=${Uri.encodeComponent(subject)}&body=${Uri.encodeComponent(body)}',
      );
    } else {
      // Desktop/Web: Open Gmail in browser
      emailLaunchUri = Uri.parse(
        'https://mail.google.com/mail/?view=cm&fs=1&to=comm@bbmp.gov.in&su=${Uri.encodeComponent(subject)}&body=${Uri.encodeComponent(body)}'
      );
    }

    try {
      if (await canLaunchUrl(emailLaunchUri)) {
        await launchUrl(emailLaunchUri, mode: LaunchMode.externalApplication);
      } else {
        // Fallback for desktop: try mailto if web link fails
        if (!(Platform.isAndroid || Platform.isIOS)) {
          final mailtoUri = Uri(
            scheme: 'mailto',
            path: 'comm@bbmp.gov.in',
            query: 'subject=${Uri.encodeComponent(subject)}&body=${Uri.encodeComponent(body)}',
          );
           if (await canLaunchUrl(mailtoUri)) {
            await launchUrl(mailtoUri);
            return;
          }
        }
        _showSnackBar('Could not launch email client', isError: true);
      }
    } catch (e) {
      _showSnackBar('Error launching email: $e', isError: true);
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    if (_showMap) {
      return _buildMapScreen(isDarkMode);
    }

    return Scaffold(
      backgroundColor: isDarkMode ? AppTheme.darkBackground : AppTheme.lightBackground,
      body: SafeArea(
        child: Column(
          children: [
            // Glass Header
            _buildGlassHeader(isDarkMode),

            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      'Report Pothole',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: isDarkMode ? Colors.white : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Help make roads safer for everyone ✨',
                      style: TextStyle(
                        fontSize: 14,
                        color: isDarkMode ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Photo Section
                    _buildGlassPhotoSection(isDarkMode),
                    const SizedBox(height: 20),

                    // Location Section (Editable)
                    _buildGlassLocationSection(isDarkMode),
                    const SizedBox(height: 20),

                    // Duration Section
                    _buildGlassDurationSection(isDarkMode),
                    const SizedBox(height: 20),

                    // Description Section
                    _buildGlassDescriptionSection(isDarkMode),
                    const SizedBox(height: 32),

                    // Submit Button
                    _buildSubmitButton(),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGlassHeader(bool isDarkMode) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.add_location_alt_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 14),
                Text(
                  'New Report',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode ? Colors.white : Colors.black87,
                  ),
                ),
                const Spacer(),
                BlocBuilder<ThemeCubit, ThemeState>(
                  builder: (context, state) {
                    return GestureDetector(
                      onTap: () => context.read<ThemeCubit>().toggleTheme(),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          state.isDark ? Icons.wb_sunny_rounded : Icons.nightlight_round,
                          size: 20,
                          color: state.isDark ? Colors.amber : Colors.indigo,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGlassPhotoSection(bool isDarkMode) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.camera_alt_rounded, size: 20, color: const Color(0xFF667eea)),
            const SizedBox(width: 10),
            Text(
              'Photo',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isDarkMode ? Colors.white : Colors.black87,
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Required',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.red),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        GestureDetector(
          onTap: _showImagePicker,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.05),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: _image == null
                        ? (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1)
                        : const Color(0xFF667eea),
                    width: _image == null ? 1 : 2,
                  ),
                ),
                child: _image != null
                    ? Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(22),
                            child: Image.file(
                              _image!,
                              fit: BoxFit.cover,
                              width: double.infinity,
                              height: double.infinity,
                            ),
                          ),
                          Positioned(
                            top: 12,
                            right: 12,
                            child: GestureDetector(
                              onTap: () => setState(() => _image = null),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.red.withOpacity(0.3),
                                      blurRadius: 8,
                                    ),
                                  ],
                                ),
                                child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                              ),
                            ),
                          ),
                        ],
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [const Color(0xFF667eea).withOpacity(0.2), const Color(0xFF764ba2).withOpacity(0.2)],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.add_a_photo_rounded, size: 36, color: Color(0xFF667eea)),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'Tap to add photo',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDarkMode ? Colors.white70 : Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Camera or Gallery',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDarkMode ? Colors.grey.shade600 : Colors.grey.shade400,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGlassLocationSection(bool isDarkMode) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.place_rounded, size: 20, color: Color(0xFF667eea)),
            const SizedBox(width: 10),
            Text(
              'Location Details',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isDarkMode ? Colors.white : Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                ),
              ),
              child: Column(
                children: [
                  // Area Name Input
                  TextField(
                    controller: _areaNameController,
                    style: TextStyle(fontWeight: FontWeight.bold, color: isDarkMode ? Colors.white : Colors.black87),
                    decoration: InputDecoration(
                      labelText: 'Area Name',
                      labelStyle: TextStyle(color: isDarkMode ? Colors.white70 : Colors.black54),
                      border: InputBorder.none,
                      icon: const Icon(Icons.apartment_rounded, color: Color(0xFF667eea)),
                    ),
                  ),
                  Divider(color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1)),
                  
                  // Address Input
                  Row(
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 16),
                        child: Icon(Icons.map_rounded, color: const Color(0xFF667eea).withOpacity(0.7)),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _addressController,
                          style: TextStyle(fontSize: 13, color: isDarkMode ? Colors.white : Colors.black87),
                          maxLines: 2,
                          decoration: InputDecoration(
                            labelText: 'Full Address',
                            labelStyle: TextStyle(color: isDarkMode ? Colors.white70 : Colors.black54),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  if (_location != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const SizedBox(width: 40),
                        Text(
                          'GPS: ${_location!.latitude.toStringAsFixed(4)}, ${_location!.longitude.toStringAsFixed(4)}',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () => setState(() => _showMap = true),
                          child: Text(
                            'Adjust Map',
                            style: TextStyle(
                              color: const Color(0xFF667eea),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGlassDurationSection(bool isDarkMode) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.timer_rounded, size: 20, color: Color(0xFF667eea)),
            const SizedBox(width: 10),
            Text(
              'Duration',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isDarkMode ? Colors.white : Colors.black87,
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Required',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.red),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
              decoration: BoxDecoration(
                color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _duration,
                  hint: Text(
                    'How long has this existed?',
                    style: TextStyle(color: isDarkMode ? Colors.white54 : Colors.black45),
                  ),
                  isExpanded: true,
                  dropdownColor: isDarkMode ? const Color(0xFF1a1a2e) : Colors.white,
                  icon: const Icon(Icons.arrow_drop_down_rounded),
                  items: _durationOptions.map((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(
                        value,
                        style: TextStyle(color: isDarkMode ? Colors.white : Colors.black87),
                      ),
                    );
                  }).toList(),
                  onChanged: (newValue) => setState(() => _duration = newValue),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGlassDescriptionSection(bool isDarkMode) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.description_rounded, size: 20, color: Color(0xFF667eea)),
            const SizedBox(width: 10),
            Text(
              'Description',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isDarkMode ? Colors.white : Colors.black87,
              ),
            ),
            const Spacer(),
            Text(
              'Optional',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              decoration: BoxDecoration(
                color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                ),
              ),
              child: TextField(
                controller: _descriptionController,
                maxLines: 4,
                style: TextStyle(color: isDarkMode ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  hintText: 'Describe the pothole (size, depth, hazard)...',
                  hintStyle: TextStyle(color: Colors.grey.shade500),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(18),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 58,
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF667eea).withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: _isLoading ? null : _submitReportFlow,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          ),
          child: _isLoading
              ? const SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.send_rounded, size: 22),
                    SizedBox(width: 10),
                    Text(
                      'Submit Report',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildMapScreen(bool isDarkMode) {
    return Scaffold(
      backgroundColor: isDarkMode ? AppTheme.darkBackground : Colors.white,
      body: Stack(
        children: [
          // Map Layer
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _location ?? const LatLng(12.9716, 77.5946),
              initialZoom: 16,
              onTap: (tapPosition, point) {
                setState(() {
                  _location = point;
                });
                _selectLocation({
                  'lat': point.latitude,
                  'lon': point.longitude,
                  'name': 'Selected Location',
                });
              },
            ),
            children: [
              TileLayer(
                urlTemplate: isDarkMode
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c'],
              ),
              if (_location != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _location!,
                      width: 50,
                      height: 50,
                      child: const Icon(
                        Icons.location_pin,
                        color: Color(0xFF667eea),
                        size: 50,
                      ),
                    ),
                  ],
                ),
            ],
          ),

          // Floating Header with Search (Copied from Home Screen style)
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Back Button + Search Bar
                  Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: (isDarkMode ? Colors.black : Colors.white).withOpacity(0.7),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        margin: const EdgeInsets.only(right: 10),
                        child: IconButton(
                          icon: Icon(Icons.arrow_back, color: isDarkMode ? Colors.white : Colors.black),
                          onPressed: () => setState(() => _showMap = false),
                        ),
                      ),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                            child: Container(
                              height: 50, // Fixed height for alignment
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              decoration: BoxDecoration(
                                color: (isDarkMode ? Colors.black : Colors.white).withOpacity(0.7),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.search_rounded, 
                                    color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.5)),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TextField(
                                      controller: _searchController,
                                      onChanged: _searchLocation,
                                      style: TextStyle(
                                        color: isDarkMode ? Colors.white : Colors.black87,
                                        fontSize: 16,
                                      ),
                                      decoration: InputDecoration(
                                        hintText: 'Search location...',
                                        hintStyle: TextStyle(
                                          color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.4),
                                        ),
                                        border: InputBorder.none,
                                        isDense: true,
                                        contentPadding: EdgeInsets.zero,
                                      ),
                                    ),
                                  ),
                                  if (_isSearching)
                                    Container(
                                      width: 16,
                                      height: 16,
                                      margin: const EdgeInsets.only(left: 8),
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.5),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Search Results List
                  if (_showSearchResults && _searchResults.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 12, left: 50), // Indent to align with search bar
                      constraints: const BoxConstraints(maxHeight: 250),
                      decoration: BoxDecoration(
                        color: (isDarkMode ? const Color(0xFF1a1a2e) : Colors.white).withOpacity(0.95),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ListView.builder(
                        padding: EdgeInsets.zero,
                        shrinkWrap: true,
                        itemCount: _searchResults.length,
                        itemBuilder: (context, index) {
                          final result = _searchResults[index];
                          return ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.05),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.location_on_rounded,
                                size: 16,
                                color: isDarkMode ? Colors.white70 : Colors.black54,
                              ),
                            ),
                            title: Text(
                              result['name'],
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isDarkMode ? Colors.white : Colors.black87,
                                fontSize: 14,
                              ),
                            ),
                            subtitle: Text(
                              [result['city'], result['state']].where((s) => s.isNotEmpty).join(', '),
                              style: TextStyle(
                                color: isDarkMode ? Colors.white54 : Colors.black45,
                                fontSize: 12,
                              ),
                            ),
                            onTap: () => _selectLocation(result),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
          
          // Done Button
          Positioned(
            bottom: 24,
            left: 20,
            right: 20,
            child: GestureDetector(
                onTap: () => setState(() => _showMap = false),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF667eea).withOpacity(0.4),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                    'Confirm Location',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }
}
