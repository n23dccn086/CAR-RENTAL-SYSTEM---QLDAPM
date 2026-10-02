package com.carrental.common.exception;

import com.carrental.common.constant.ErrorCode;

public class BadRequestException extends AppException {

    public BadRequestException(ErrorCode errorCode) {
        super(errorCode);
    }

    public BadRequestException(ErrorCode errorCode, String customMessage) {
        super(errorCode, customMessage);
    }
}