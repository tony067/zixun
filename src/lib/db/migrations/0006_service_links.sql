-- 个性服务二期预备：外链问卷 + 报告链接/文件
ALTER TABLE services ADD COLUMN IF NOT EXISTS questionnaire_link text;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS questionnaire_link text;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS report_link text;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS report_file_url text;
