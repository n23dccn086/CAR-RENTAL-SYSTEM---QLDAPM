package com.carrental.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmitVerificationRequest {

    @JsonAlias({"gplx_doc_ids", "gplxDocIds"})
    List<Long> gplxDocIds;

    @JsonAlias({"cccd_doc_ids", "cccdDocIds"})
    List<Long> cccdDocIds;

    @JsonAlias({"selfie_doc_id", "selfieDocId"})
    Long selfieDocId;
}
