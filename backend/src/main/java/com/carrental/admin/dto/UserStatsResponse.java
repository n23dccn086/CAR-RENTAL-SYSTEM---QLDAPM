package com.carrental.admin.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserStatsResponse {

    long totalUsers;
    long totalCustomers;
    long totalOwners;
    long totalDrivers;
    long totalAdmins;

    long pendingVerifications;
    long activeUsers;
    long lockedUsers;
}