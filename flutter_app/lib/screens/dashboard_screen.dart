import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../cubit/reports_cubit.dart';
import '../models/pothole_report.dart';
import '../widgets/gradient_background.dart';
import '../widgets/floating_header.dart';
import '../widgets/glass_card.dart';
import '../theme/app_theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ReportsCubit>().loadReports();
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return GradientBackground(
      child: Stack(
        children: [
          // Content
          BlocBuilder<ReportsCubit, ReportsState>(
            builder: (context, state) {
              if (state is ReportsLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              if (state is ReportsError) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red.shade300,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Failed to load reports',
                        style: TextStyle(
                          fontSize: 18,
                          color: isDarkMode ? Colors.white : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () =>
                            context.read<ReportsCubit>().loadReports(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                );
              }

              if (state is ReportsLoaded) {
                if (state.reports.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.inbox_outlined,
                          size: 64,
                          color: isDarkMode
                              ? Colors.grey.shade600
                              : Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No reports yet',
                          style: TextStyle(
                            fontSize: 18,
                            color: isDarkMode ? Colors.white : Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => context.read<ReportsCubit>().refreshReports(),
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 120, 16, 100),
                    itemCount: state.reports.length,
                    itemBuilder: (context, index) {
                      return _buildReportCard(state.reports[index], isDarkMode);
                    },
                  ),
                );
              }

              return const SizedBox.shrink();
            },
          ),

          // Floating Header
          const Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: FloatingHeader(),
          ),
        ],
      ),
    );
  }

  Widget _buildReportCard(PotholeReport report, bool isDarkMode) {
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: CachedNetworkImage(
              imageUrl: report.imageUrl,
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                height: 180,
                color: isDarkMode ? Colors.grey.shade800 : Colors.grey.shade200,
                child: const Center(child: CircularProgressIndicator()),
              ),
              errorWidget: (context, url, error) => Container(
                height: 180,
                color: isDarkMode ? Colors.grey.shade800 : Colors.grey.shade200,
                child: const Icon(Icons.broken_image, size: 40),
              ),
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            report.areaName ?? 'Unknown Area',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isDarkMode ? Colors.white : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            report.address ?? 'No address',
                            style: TextStyle(
                              fontSize: 14,
                              color: isDarkMode
                                  ? Colors.grey.shade400
                                  : Colors.grey.shade600,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    _buildStatusBadge(report.status, isDarkMode),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.only(top: 12),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: isDarkMode
                            ? Colors.grey.shade700
                            : Colors.grey.shade200,
                      ),
                    ),
                  ),
                  child: Text(
                    'Reported ${_formatDate(report.createdAt)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDarkMode
                          ? Colors.grey.shade400
                          : Colors.grey.shade600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status, bool isDarkMode) {
    Color bgColor;
    Color textColor;

    switch (status.toLowerCase()) {
      case 'resolved':
        bgColor = isDarkMode
            ? Colors.green.shade900.withOpacity(0.5)
            : Colors.green.shade100;
        textColor = isDarkMode ? Colors.green.shade100 : Colors.green.shade800;
        break;
      case 'in-progress':
        bgColor = isDarkMode
            ? Colors.blue.shade900.withOpacity(0.5)
            : Colors.blue.shade100;
        textColor = isDarkMode ? Colors.blue.shade100 : Colors.blue.shade800;
        break;
      default:
        bgColor = isDarkMode
            ? Colors.yellow.shade900.withOpacity(0.5)
            : Colors.yellow.shade100;
        textColor =
            isDarkMode ? Colors.yellow.shade100 : Colors.yellow.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: textColor,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
