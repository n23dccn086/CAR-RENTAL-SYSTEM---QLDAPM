package com.carrental.common.exception;

import com.carrental.common.constant.ErrorCode;

public class UnauthorizedException extends AppException {

    public UnauthorizedException(ErrorCode errorCode) {
        super(errorCode);
    }

    public UnauthorizedException(ErrorCode errorCode, String customMessage) {
        super(errorCode, customMessage);
    }
}