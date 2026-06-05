package com.quocthai.pharmacy_service.service;

import com.quocthai.pharmacy_service.search.document.ProductDocumentSearch;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ElasticsearchHealthService {

    private final ElasticsearchOperations operations;

    @PostConstruct
    public void check() {
        try {
            boolean exists = operations
                    .indexOps(ProductDocumentSearch.class)
                    .exists();

            System.out.println("✅ Elasticsearch connected!");
            System.out.println("Index exists: " + exists);

        } catch (Exception e) {
            System.out.println("❌ Elasticsearch connection failed!");
            e.printStackTrace();
        }
    }
}
