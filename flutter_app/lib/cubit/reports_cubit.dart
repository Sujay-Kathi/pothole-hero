import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../models/pothole_report.dart';
import '../services/supabase_service.dart';

// States
abstract class ReportsState extends Equatable {
  const ReportsState();

  @override
  List<Object?> get props => [];
}

class ReportsInitial extends ReportsState {}

class ReportsLoading extends ReportsState {}

class ReportsLoaded extends ReportsState {
  final List<PotholeReport> reports;
  final int totalCount;

  const ReportsLoaded({required this.reports, required this.totalCount});

  @override
  List<Object?> get props => [reports, totalCount];
}

class ReportsError extends ReportsState {
  final String message;

  const ReportsError(this.message);

  @override
  List<Object?> get props => [message];
}

// Cubit
class ReportsCubit extends Cubit<ReportsState> {
  final SupabaseService _supabaseService;

  ReportsCubit(this._supabaseService) : super(ReportsInitial());

  Future<void> loadReports() async {
    emit(ReportsLoading());
    try {
      final reports = await _supabaseService.fetchReports();
      final count = await _supabaseService.getReportCount();
      emit(ReportsLoaded(reports: reports, totalCount: count));
    } catch (e) {
      emit(ReportsError(e.toString()));
    }
  }

  Future<void> refreshReports() async {
    try {
      final reports = await _supabaseService.fetchReports();
      final count = await _supabaseService.getReportCount();
      emit(ReportsLoaded(reports: reports, totalCount: count));
    } catch (e) {
      emit(ReportsError(e.toString()));
    }
  }
}
