package com.quocthai.pharmacy_service.search.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SearchSuggestionResponse {

    String id;
    String name;
    String slug;
    String primaryImageUrl;
    BigDecimal priceDefault;
    Boolean prescription;
}
