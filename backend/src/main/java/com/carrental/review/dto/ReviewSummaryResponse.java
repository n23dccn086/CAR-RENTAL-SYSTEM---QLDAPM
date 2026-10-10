package com.carrental.review.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewSummaryResponse {

    Double avgRating;
    Long total;
    Long star5;
    Long star4;
    Long star3;
    Long star2;
    Long star1;

    // ===== CONTRACT COMPATIBILITY (snake_case getters) =====

    public Double getAvg_rating() {
        return avgRating;
    }

    public Long getStar_5() {
        return star5;
    }

    public Long getStar_4() {
        return star4;
    }

    public Long getStar_3() {
        return star3;
    }

    public Long getStar_2() {
        return star2;
    }

    public Long getStar_1() {
        return star1;
    }
}
