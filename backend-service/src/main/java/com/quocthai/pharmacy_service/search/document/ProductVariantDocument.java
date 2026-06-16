package com.quocthai.pharmacy_service.search.document;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantDocument {

    private String id;

    private String sku;

    private String variantName;

    private BigDecimal price;

    private BigDecimal originalPrice;

    private Boolean variantDefault;

    private Integer stockQuantity;
}
