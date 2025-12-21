import 'package:share_plus/share_plus.dart';
import '../models/pothole_report.dart';

class ShareService {
  static final ShareService _instance = ShareService._internal();
  factory ShareService() => _instance;
  ShareService._internal();

  // Generate shareable link for a report
  String generateShareLink(PotholeReport report) {
    // This creates a deep link - you can later set up dynamic links
    // For now, we'll use a simple format that shows report details
    return 'https://potholehero.app/report/${report.id}';
  }

  // Share report via system share sheet
  Future<void> shareReport(PotholeReport report) async {
    final link = generateShareLink(report);
    final address = report.address ?? 'Unknown location';
    final areaName = report.areaName ?? 'Unknown area';
    final status = report.status.toUpperCase();

    final shareText = '''
🚧 Pothole Alert! 🚧

📍 Location: $areaName
📌 Address: $address
📊 Status: $status

I reported this pothole using Pothole Hero app. Help make our roads safer!

🔗 View Report: $link

Download Pothole Hero and report potholes in your area! 🦸‍♂️
''';

    await Share.share(
      shareText,
      subject: 'Pothole Report - $areaName',
    );
  }

  // Share report with image
  Future<void> shareReportWithImage(PotholeReport report) async {
    final address = report.address ?? 'Unknown location';
    final areaName = report.areaName ?? 'Unknown area';
    final status = report.status.toUpperCase();
    final link = generateShareLink(report);

    final shareText = '''
🚧 Pothole Alert at $areaName! 🚧

📍 $address
📊 Status: $status

$link

#PotholeHero #RoadSafety #CitizenReport
''';

    // Share with the image URL if available
    if (report.imageUrl.isNotEmpty) {
      await Share.shareUri(Uri.parse(report.imageUrl));
    } else {
      await Share.share(shareText, subject: 'Pothole Report - $areaName');
    }
  }

  // Quick share (just the link)
  Future<void> quickShare(PotholeReport report) async {
    final link = generateShareLink(report);
    final areaName = report.areaName ?? 'Pothole Report';
    
    await Share.share(
      '🚧 Pothole at $areaName: $link',
      subject: 'Pothole Report',
    );
  }

  // Share leaderboard position
  Future<void> shareAchievement({
    required int rank,
    required int points,
    required int reports,
    required List<String> badges,
  }) async {
    final badgeEmojis = badges.take(5).join(' ');
    
    final shareText = '''
🏆 My Pothole Hero Stats 🏆

🥇 Rank: #$rank
⭐ Points: $points
📝 Reports: $reports
${badges.isNotEmpty ? '🎖️ Badges: $badgeEmojis' : ''}

Join me in making our roads safer! Download Pothole Hero today! 🦸‍♂️

#PotholeHero #RoadSafety #CommunityHero
''';

    await Share.share(shareText, subject: 'My Pothole Hero Achievement');
  }

  // Share app
  Future<void> shareApp() async {
    const shareText = '''
🦸 Pothole Hero - Make Roads Safer! 🦸

📸 Snap a photo of potholes
📍 Auto-detect location
📧 Report directly to authorities
🏆 Earn points and badges!

Download now and become a Road Hero! 🚧

#PotholeHero #RoadSafety
''';

    await Share.share(shareText, subject: 'Check out Pothole Hero App!');
  }
}
