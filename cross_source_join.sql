-- Postman Datasets (Beta): Cross-Source Join Example
-- 
-- This query demonstrates how to join the static CSV data source (equipment_catalog)
-- with the dynamic MySQL data source (view_active_logistics) using `equipment_id` as the key.
--
-- In Postman Datasets, you would configure this join visually or via a combined dataset run:

SELECT 
    -- Fields from Static CSV Data Source (equipment_catalog.csv)
    c.equipment_id,
    c.name AS equipment_name,
    c.category,
    c.mass_kg,
    c.price_credits,

    -- Fields from Dynamic MySQL Data Source (view_active_logistics view)
    v.shipment_id,
    v.destination,
    v.shipment_status,
    v.warehouse_bay,
    v.current_stock

FROM equipment_catalog c
INNER JOIN view_active_logistics v 
    ON c.equipment_id = v.equipment_id

ORDER BY 
    v.shipment_status DESC, 
    c.price_credits DESC;

-- =========================================================================
-- DEMO NOTE FOR POSTMAN VIDEO/DOCS:
-- This cross-source join links static, version-controlled product metadata 
-- directly with dynamic operational transaction logs, allowing collection runs
-- to validate API payloads using rich, comprehensive, and up-to-date data.
-- =========================================================================
