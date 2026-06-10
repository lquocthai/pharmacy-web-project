package com.quocthai.pharmacy_service.search.service;

import com.quocthai.pharmacy_service.dto.response.PageResponse;
import com.quocthai.pharmacy_service.search.document.ProductDocumentSearch;
import com.quocthai.pharmacy_service.search.dto.SearchSuggestionResponse;
import com.quocthai.pharmacy_service.search.mapper.ProductSearchMapper;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductSearchService {

    ElasticsearchOperations elasticsearchOperations;
    ProductSearchMapper productSearchMapper;

    /**
     * Suggestion API: kết hợp match + fuzzy + prefix để auto-complete.
     * Tìm trên name và description, với name được boost cao hơn.
     */
    public List<SearchSuggestionResponse> getSuggestions(
            String keyword,
            int size
    ) {

        if (!StringUtils.hasText(keyword)) {
            return Collections.emptyList();
        }

        String trimmed = keyword.trim();

        Query boolQuery = Query.of(q -> q
                .bool(b -> b

                        .should(s -> s.match(m -> m
                                .field("name")
                                .query(trimmed)
                                .boost(10.0f)
                                .fuzziness("AUTO")
                        ))

                        .should(s -> s.match(m -> m
                                .field("symptomKeywords")
                                .query(trimmed)
                                .boost(9.0f)
                                .fuzziness("AUTO")
                        ))

                        .should(s -> s.prefix(p -> p
                                .field("name")
                                .value(trimmed.toLowerCase())
                                .boost(8.0f)
                        ))

//                        .should(s -> s.match(m -> m
//                                .field("description")
//                                .query(trimmed)
//                                .boost(3.0f)
//                        ))

                        .minimumShouldMatch("1")
                )
        );

        NativeQuery query = NativeQuery.builder()
                .withQuery(boolQuery)
                .withPageable(PageRequest.of(0, size))
                .build();

        SearchHits<ProductDocumentSearch> hits =
                elasticsearchOperations.search(
                        query,
                        ProductDocumentSearch.class
                );

        return hits.getSearchHits()
                .stream()
                .map(SearchHit::getContent)
                .map(productSearchMapper::toSuggestionResponse)
                .toList();
    }

    /**
     * Full product search: MultiMatch Query với fuzziness AUTO.
     * Tìm trên name (boost 3), description, manufacturer, categoryName.
     */
    public PageResponse<ProductDocumentSearch> searchProducts(
            String keyword,
            int page,
            int size
    ) {

        if (!StringUtils.hasText(keyword)) {
            NativeQuery query = NativeQuery.builder()
                    .withQuery(Query.of(q -> q.matchAll(m -> m)))
                    .withPageable(PageRequest.of(page, size))
                    .build();

            SearchHits<ProductDocumentSearch> hits =
                    elasticsearchOperations.search(
                            query,
                            ProductDocumentSearch.class
                    );

            return buildPageResponse(hits, page, size);
        }

        String trimmed = keyword.trim();

        Query boolQuery = Query.of(q -> q
                .bool(b -> b

                        // Ưu tiên tên sản phẩm
                        .should(s -> s.match(m -> m
                                .field("name")
                                .query(trimmed)
                                .boost(10.0f)
                                .fuzziness("AUTO")
                        ))


                        // Ưu tiên triệu chứng
                                .should(s -> s.match(m -> m
                                        .field("symptomKeywords")
                                        .query(trimmed)
                                        .boost(9.0f)
                                        .fuzziness("AUTO")
                                ))

//                        // Mô tả
//                        .should(s -> s.match(m -> m
//                                .field("description")
//                                .query(trimmed)
//                                .boost(3.0f)
//                                .fuzziness("AUTO")
//                        ))

                        // Nhà sản xuất
                        .should(s -> s.match(m -> m
                                .field("manufacturer")
                                .query(trimmed)
                                .boost(2.0f)
                        ))

                        // Danh mục
                        .should(s -> s.match(m -> m
                                .field("categoryName")
                                .query(trimmed)
                                .boost(1.0f)
                        ))

                        .minimumShouldMatch("1")
                )
        );

        NativeQuery query = NativeQuery.builder()
                .withQuery(boolQuery)
                .withPageable(PageRequest.of(page, size))
                .build();

        SearchHits<ProductDocumentSearch> hits =
                elasticsearchOperations.search(
                        query,
                        ProductDocumentSearch.class
                );

        return buildPageResponse(hits, page, size);
    }

    private PageResponse<ProductDocumentSearch> buildPageResponse(
            SearchHits<ProductDocumentSearch> hits, int page, int size) {

        List<ProductDocumentSearch> content = hits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .toList();

        long totalElements = hits.getTotalHits();
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;

        return PageResponse.<ProductDocumentSearch>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(page >= totalPages - 1)
                .build();
    }
}
