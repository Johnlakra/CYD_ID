/// Server pagination block, `data.pagination` on `GET /profiles`,
/// `/shop/shops` and `/shop/products` (doc 08 §13).
class Pagination {
  const Pagination({
    required this.currentPage,
    required this.perPage,
    required this.total,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrev,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) => Pagination(
    currentPage: (json['current_page'] as num?)?.toInt() ?? 1,
    perPage: (json['per_page'] as num?)?.toInt() ?? 0,
    total: (json['total'] as num?)?.toInt() ?? 0,
    totalPages: (json['total_pages'] as num?)?.toInt() ?? 0,
    hasNext: json['has_next'] as bool? ?? false,
    hasPrev: json['has_prev'] as bool? ?? false,
  );

  final int currentPage;
  final int perPage;
  final int total;
  final int totalPages;
  final bool hasNext;
  final bool hasPrev;

  @override
  bool operator ==(Object other) =>
      other is Pagination &&
      other.currentPage == currentPage &&
      other.perPage == perPage &&
      other.total == total &&
      other.totalPages == totalPages &&
      other.hasNext == hasNext &&
      other.hasPrev == hasPrev;

  @override
  int get hashCode =>
      Object.hash(currentPage, perPage, total, totalPages, hasNext, hasPrev);
}

/// Client-side page holder (not a server shape).
class Paged<T> {
  const Paged({required this.items, required this.pagination});

  final List<T> items;
  final Pagination pagination;

  bool get hasNext => pagination.hasNext;
}
