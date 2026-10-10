package com.carrental.car.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CarPricingRequest {

    @JsonAlias({"price_per_day", "pricePerDay"})
    Long pricePerDay;

    @JsonAlias({"price_weekend", "priceWeekend"})
    Long priceWeekend;

    @JsonAlias({"price_holiday", "priceHoliday"})
    Long priceHoliday;

    @JsonAlias({"price_with_driver", "priceWithDriver"})
    Long priceWithDriver;

    @JsonAlias({"base_km_per_day", "baseKmPerDay"})
    Integer baseKmPerDay;

    @JsonAlias({"overage_km_price", "extra_km_price", "extraKmPrice"})
    Long extraKmPrice;

    @JsonAlias({"delivery_fee_per_km", "delivery_fee", "deliveryFee"})
    Long deliveryFee;

    @JsonAlias({"cleaning_fee", "cleaningFee"})
    Long cleaningFee;

    @JsonAlias({"insurance_fee_per_day", "insuranceFeePerDay"})
    Long insuranceFeePerDay;

    @JsonAlias({"deposit_percent", "depositPercent"})
    Integer depositPercent;
}
