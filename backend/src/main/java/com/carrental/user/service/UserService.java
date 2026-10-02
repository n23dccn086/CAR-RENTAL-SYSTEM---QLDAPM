package com.carrental.user.service;

import com.carrental.user.dto.UserDto;
import com.carrental.user.entity.User;

public interface UserService {

    UserDto getUserById(Long id);

    UserDto getUserByPhone(String phone);

    User getEntityById(Long id);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    UserDto updateUser(Long id, UserDto userDto);

    void deleteUser(Long id);
}