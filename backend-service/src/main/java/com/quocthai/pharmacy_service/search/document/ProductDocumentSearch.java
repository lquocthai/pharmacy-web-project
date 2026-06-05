package com.quocthai.pharmacy_service.search.document;


import org.springframework.data.annotation.Id;
import lombok.*;
import org.springframework.data.elasticsearch.annotations.*;

import java.math.BigDecimal;
import java.util.List;

@Document(indexName = "products_v1")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDocumentSearch {

    @Id
    private String id;

    @MultiField(
            mainField = @Field(
                    type = FieldType.Text,
                    analyzer = "standard"
            ),
            otherFields = {
                    @InnerField(
                            suffix = "keyword",
                            type = FieldType.Keyword
                    )
            }
    )
    private String name;

    @Field(type = FieldType.Text)
    private String description;

    @Field(type = FieldType.Keyword)
    private String slug;

    @Field(type = FieldType.Keyword)
    private String manufacturer;

    @Field(type = FieldType.Keyword)
    private String country;

    @Field(type = FieldType.Double)
    private BigDecimal priceDefault;

    @Field(type = FieldType.Keyword)
    private String primaryImageUrl;

    @Field(type = FieldType.Keyword)
    private String categoryId;

    @Field(type = FieldType.Text)
    private String categoryName;

    @Field(type = FieldType.Keyword)
    private String categorySlug;

    @Field(type = FieldType.Nested)
    private List<ProductVariantDocument> variants;

    @Field(type = FieldType.Boolean)
    private Boolean prescription;
}
