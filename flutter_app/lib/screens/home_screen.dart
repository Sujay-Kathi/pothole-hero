import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../cubit/reports_cubit.dart';
import '../cubit/theme_cubit.dart';
import '../models/pothole_report.dart';
import '../theme/app_theme.dart';
import '../services/supabase_service.dart';
import '../services/device_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final MapController _mapController = MapController();
  final SupabaseService _supabaseService = SupabaseService();
  final DeviceService _deviceService = DeviceService();
  LatLng? _currentLocation;
  LatLng? _selectedLocation;
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  bool _showSearchResults = false;
  String? _deviceId;
  Map<String, bool> _upvoteStatus = {};

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    _loadDeviceId();
    context.read<ReportsCubit>().loadReports();
  }

  Future<void> _loadDeviceId() async {
    _deviceId = await _deviceService.getDeviceId();
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _currentLocation = const LatLng(12.9716, 77.5946);
          _isLoading = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _currentLocation = const LatLng(12.9716, 77.5946);
            _isLoading = false;
          });
          return;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _currentLocation = const LatLng(12.9716, 77.5946);
          _isLoading = false;
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentLocation = LatLng(position.latitude, position.longitude);
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error getting location: $e');
      setState(() {
        _currentLocation = const LatLng(12.9716, 77.5946);
        _isLoading = false;
      });
    }
  }

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
      final lat = _currentLocation?.latitude ?? 12.9716;
      final lon = _currentLocation?.longitude ?? 77.5946;

      // Restrict search to Bengaluru (approximate bounding box)
      // bbox format: min_lon,min_lat,max_lon,max_lat
      const bbox = '77.3,12.8,77.9,13.3';
      final response = await http.get(Uri.parse(
        'https://photon.komoot.io/api/?q=${Uri.encodeComponent(query)}&bbox=$bbox&lat=$lat&lon=$lon&limit=8&lang=en',
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
    _mapController.move(LatLng(lat, lon), 16);
    setState(() {
      _searchController.text = location['name'];
      _showSearchResults = false;
      _selectedLocation = LatLng(lat, lon);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Full screen map
          if (_isLoading)
            Container(
              color: isDarkMode ? AppTheme.darkBackground : AppTheme.lightBackground,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            )
          else
            SizedBox(
              width: size.width,
              height: size.height,
              child: BlocBuilder<ReportsCubit, ReportsState>(
                builder: (context, state) {
                  final reports = state is ReportsLoaded ? state.reports : <PotholeReport>[];

                  return FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: _currentLocation!,
                      initialZoom: 15,
                      minZoom: 5,
                      maxZoom: 18,
                    ),
                    children: [
                      TileLayer(
                        // Use OpenStreetMap tiles with full labels, building names, and area details
                        urlTemplate: isDarkMode
                            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                            : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        subdomains: const ['a', 'b', 'c'],
                        userAgentPackageName: 'com.sujaykathi.pothole_hero',
                        maxZoom: 19,
                      ),
                      MarkerLayer(
                        markers: [
                          // Current location marker
                          Marker(
                            point: _currentLocation!,
                            width: 60,
                            height: 60,
                            child: _buildCurrentLocationMarker(),
                          ),
                          // Selected Search Location Marker
                          if (_selectedLocation != null)
                            Marker(
                              point: _selectedLocation!,
                              width: 50,
                              height: 50,
                              child: const Icon(
                                Icons.location_on_rounded,
                                color: Colors.red,
                                size: 50,
                              ),
                            ),
                          // Pothole markers
                          ...reports.map((report) => Marker(
                                point: LatLng(report.latitude, report.longitude),
                                width: 44,
                                height: 44,
                                child: GestureDetector(
                                  onTap: () => _showReportDetails(report),
                                  child: _buildPotholeMarker(report),
                                ),
                              )),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ),

          // Floating Header with Search
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Glass Header
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: (isDarkMode ? Colors.black : Colors.white).withOpacity(0.7),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                          ),
                        ),
                        child: Row(
                          children: [
                            // Logo
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.location_on, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Pothole Hero',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                                color: isDarkMode ? Colors.white : Colors.black87,
                              ),
                            ),
                            const Spacer(),
                            // Report count badge
                            BlocBuilder<ReportsCubit, ReportsState>(
                              builder: (context, state) {
                                final count = state is ReportsLoaded ? state.totalCount : 0;
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.warning_rounded, size: 14, color: Colors.red),
                                      const SizedBox(width: 4),
                                      Text(
                                        '$count',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.red,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                            const SizedBox(width: 8),
                            // Theme toggle
                            BlocBuilder<ThemeCubit, ThemeState>(
                              builder: (context, state) {
                                return GestureDetector(
                                  onTap: () => context.read<ThemeCubit>().toggleTheme(),
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
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
                  const SizedBox(height: 12),

                  // Search Box
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                      child: Container(
                        decoration: BoxDecoration(
                          color: (isDarkMode ? Colors.black : Colors.white).withOpacity(0.7),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                          ),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: _searchLocation,
                          style: TextStyle(
                            color: isDarkMode ? Colors.white : Colors.black87,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Search in Bengaluru...',
                            hintStyle: TextStyle(
                              color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.5),
                            ),
                            prefixIcon: Icon(
                              Icons.search_rounded,
                              color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.5),
                            ),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? GestureDetector(
                                    onTap: () {
                                      _searchController.clear();
                                      setState(() {
                                        _searchResults = [];
                                        _showSearchResults = false;
                                      });
                                    },
                                    child: Icon(
                                      Icons.close_rounded,
                                      color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.5),
                                    ),
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Search Results
                  if (_showSearchResults && _searchResults.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      constraints: const BoxConstraints(maxHeight: 250),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                          child: Container(
                            decoration: BoxDecoration(
                              color: (isDarkMode ? Colors.black : Colors.white).withOpacity(0.85),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                              ),
                            ),
                            child: ListView.builder(
                              shrinkWrap: true,
                              itemCount: _searchResults.length,
                              itemBuilder: (context, index) {
                                final result = _searchResults[index];
                                return ListTile(
                                  leading: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryBlue.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      Icons.place_rounded,
                                      color: AppTheme.primaryBlue,
                                      size: 20,
                                    ),
                                  ),
                                  title: Text(
                                    result['name'],
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: isDarkMode ? Colors.white : Colors.black87,
                                    ),
                                  ),
                                  subtitle: Text(
                                    '${result['city']}, ${result['state']}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDarkMode ? Colors.grey.shade400 : Colors.grey.shade600,
                                    ),
                                  ),
                                  onTap: () => _selectLocation(result),
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Map Controls (floating buttons)
          Positioned(
            right: 16,
            bottom: 100,
            child: Column(
              children: [
                _buildGlassButton(
                  icon: Icons.add_rounded,
                  onTap: () => _mapController.move(
                    _mapController.camera.center,
                    _mapController.camera.zoom + 1,
                  ),
                  isDarkMode: isDarkMode,
                ),
                const SizedBox(height: 8),
                _buildGlassButton(
                  icon: Icons.remove_rounded,
                  onTap: () => _mapController.move(
                    _mapController.camera.center,
                    _mapController.camera.zoom - 1,
                  ),
                  isDarkMode: isDarkMode,
                ),
                const SizedBox(height: 16),
                _buildGlassButton(
                  icon: Icons.my_location_rounded,
                  onTap: () {
                    if (_currentLocation != null) {
                      _mapController.move(_currentLocation!, 16);
                    }
                  },
                  isDarkMode: isDarkMode,
                  isAccent: true,
                ),
              ],
            ),
          ),

          // Legend
          Positioned(
            left: 16,
            bottom: 100,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: (isDarkMode ? Colors.black : Colors.white).withOpacity(0.7),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildLegendItem(Colors.orange, 'Pending', isDarkMode),
                      const SizedBox(height: 8),
                      _buildLegendItem(Colors.green, 'Resolved', isDarkMode),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassButton({
    required IconData icon,
    required VoidCallback onTap,
    required bool isDarkMode,
    bool isAccent = false,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: isAccent
                  ? const LinearGradient(colors: [Color(0xFF667eea), Color(0xFF764ba2)])
                  : null,
              color: isAccent ? null : (isDarkMode ? Colors.black : Colors.white).withOpacity(0.7),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
              ),
            ),
            child: Icon(
              icon,
              size: 22,
              color: isAccent ? Colors.white : (isDarkMode ? Colors.white : Colors.black87),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentLocationMarker() {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: const Color(0xFF667eea).withOpacity(0.2),
            shape: BoxShape.circle,
          ),
        ),
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF667eea), Color(0xFF764ba2)],
            ),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF667eea).withOpacity(0.5),
                blurRadius: 10,
                spreadRadius: 2,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPotholeMarker(PotholeReport report) {
    final isResolved = report.status == 'resolved';
    final color = isResolved ? Colors.green : Colors.orange;

    return Container(
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2.5),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.5),
            blurRadius: 8,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Icon(
        isResolved ? Icons.check_rounded : Icons.warning_rounded,
        color: Colors.white,
        size: 20,
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label, bool isDarkMode) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.4),
                blurRadius: 4,
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDarkMode ? Colors.white70 : Colors.black54,
          ),
        ),
      ],
    );
  }

  void _showReportDetails(PotholeReport report) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    bool hasUpvoted = _upvoteStatus[report.id] ?? false;
    int upvoteCount = report.upvoteCount;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: (isDarkMode ? const Color(0xFF1a1a2e) : Colors.white).withOpacity(0.9),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 50,
                      height: 5,
                      decoration: BoxDecoration(
                        color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.network(
                      report.imageUrl,
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        height: 180,
                        color: isDarkMode ? Colors.grey.shade800 : Colors.grey.shade200,
                        child: const Icon(Icons.broken_image_rounded, size: 50),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Status & Severity Row
                  Row(
                    children: [
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: report.status == 'resolved'
                              ? Colors.green.withOpacity(0.15)
                              : Colors.orange.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          report.status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: report.status == 'resolved' ? Colors.green : Colors.orange,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Severity badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: _getSeverityColor(report.severity).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _getSeverityEmoji(report.severity),
                              style: const TextStyle(fontSize: 12),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              report.severity.toUpperCase(),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: _getSeverityColor(report.severity),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    report.areaName ?? 'Unknown Area',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: isDarkMode ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.place_rounded, size: 16, color: Colors.grey.shade500),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          report.address ?? 'No address available',
                          style: TextStyle(color: Colors.grey.shade500),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.schedule_rounded, size: 16, color: Colors.grey.shade500),
                      const SizedBox(width: 6),
                      Text(
                        'Reported on ${_formatDate(report.createdAt)}',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  
                  // Upvote Section
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: (isDarkMode ? Colors.white : Colors.black).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        // Upvote Button
                        GestureDetector(
                          onTap: () async {
                            if (_deviceId == null) return;
                            try {
                              final isNowUpvoted = await _supabaseService.toggleUpvote(report.id, _deviceId!);
                              setModalState(() {
                                hasUpvoted = isNowUpvoted;
                                upvoteCount += isNowUpvoted ? 1 : -1;
                              });
                              setState(() {
                                _upvoteStatus[report.id] = isNowUpvoted;
                              });
                              // Refresh reports
                              if (mounted) {
                                context.read<ReportsCubit>().loadReports();
                              }
                            } catch (e) {
                              debugPrint('Upvote failed: $e');
                            }
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            decoration: BoxDecoration(
                              gradient: hasUpvoted
                                  ? const LinearGradient(
                                      colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                                    )
                                  : null,
                              color: hasUpvoted ? null : (isDarkMode ? Colors.white : Colors.black).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  hasUpvoted ? Icons.thumb_up : Icons.thumb_up_outlined,
                                  size: 20,
                                  color: hasUpvoted ? Colors.white : (isDarkMode ? Colors.white70 : Colors.black54),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '$upvoteCount',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: hasUpvoted ? Colors.white : (isDarkMode ? Colors.white70 : Colors.black54),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Reporters count
                        Expanded(
                          child: Text(
                            '${upvoteCount + 1} people reported this',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDarkMode ? Colors.white70 : Colors.black54,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'low':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.deepOrange;
      case 'critical':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  String _getSeverityEmoji(String severity) {
    switch (severity.toLowerCase()) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🟠';
      case 'critical':
        return '🔴';
      default:
        return '🟡';
    }
  }

  String _formatDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
