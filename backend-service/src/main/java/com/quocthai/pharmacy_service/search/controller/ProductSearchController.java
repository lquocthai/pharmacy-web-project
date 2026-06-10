package com.quocthai.pharmacy_service.search.controller;

import com.quocthai.pharmacy_service.dto.response.ApiResponse;
import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.search.document.ProductDocumentSearch;
import com.quocthai.pharmacy_service.search.dto.SearchSuggestionResponse;
import com.quocthai.pharmacy_service.search.service.ProductSearchService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductSearchController {

    ProductSearchService productSearchService;

    /**
     * GET /search/suggestions?keyword=vit&size=10
     * Auto-complete / suggestion với fuzzy + prefix + match.
     */
    @GetMapping("/suggestions")
    public ApiResponse<List<SearchSuggestionResponse>> getSuggestions(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "10") int size
    ) {
        log.info("GET /search/suggestions - keyword={}, size={}", keyword, size);
        return ApiResponse.<List<SearchSuggestionResponse>>builder()
                .result(productSearchService.getSuggestions(keyword, size))
                .build();
    }

    /**
     * GET /search/products?keyword=vitamin&page=0&size=20
     * Full-text search với MultiMatch, fuzziness AUTO, relevance ranking.
     */
    @GetMapping("/products")
    public ApiResponse<PageResponse<ProductDocumentSearch>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("GET /search/products - keyword={}, page={}, size={}", keyword, page, size);
        return ApiResponse.<PageResponse<ProductDocumentSearch>>builder()
                .result(productSearchService.searchProducts(keyword, page, size))
                .build();
    }
}
