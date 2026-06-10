package com.quocthai.pharmacy_service.search.mapper;


import com.quocthai.pharmacy_service.search.document.ProductDocumentSearch;
import com.quocthai.pharmacy_service.search.dto.SearchSuggestionResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductSearchMapper {

    SearchSuggestionResponse toSuggestionResponse(ProductDocumentSearch document);

}
