package com.example.iam.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    @Size(min = 4, max = 64)
    private String username;

    @NotBlank
    @Email
    @Size(max = 128)
    private String email;

    @NotBlank
    @Size(min = 8, max = 72)
    private String password;

    @Size(max = 20)
    @Pattern(regexp = "^$|^[0-9+()\\- ]{8,20}$")
    private String phone;
}
