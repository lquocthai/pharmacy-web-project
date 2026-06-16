package com.quocthai.pharmacy_service.search.repository;

import com.quocthai.pharmacy_service.search.document.ProductDocumentSearch;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductSearchRepository extends ElasticsearchRepository<ProductDocumentSearch, String> {
}
