import 'package:cyd_app/models/paging.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Pagination.fromJson maps snake_case keys', () {
    final p = Pagination.fromJson({
      'current_page': 2,
      'per_page': 25,
      'total': 60,
      'total_pages': 3,
      'has_next': true,
      'has_prev': true,
    });
    expect(p.currentPage, 2);
    expect(p.perPage, 25);
    expect(p.total, 60);
    expect(p.totalPages, 3);
    expect(p.hasNext, isTrue);
    expect(p.hasPrev, isTrue);
  });

  test('missing keys fall back and never throw', () {
    final p = Pagination.fromJson({});
    expect(p.currentPage, 1);
    expect(p.hasNext, isFalse);
  });

  test('value equality and Paged.hasNext', () {
    final a = Pagination.fromJson({'current_page': 1, 'has_next': true});
    final b = Pagination.fromJson({'current_page': 1, 'has_next': true});
    expect(a, b);
    expect(a.hashCode, b.hashCode);
    expect(Paged<int>(items: const [1], pagination: a).hasNext, isTrue);
  });
}
