-- V22: Bỏ config hoàn tiền khi Owner từ chối (bắt buộc hoàn 100%)
DELETE FROM platform_config WHERE config_key = 'refund_owner_reject_percent';