-- Active: MySQL Database Schema for AstroMart Supply Logistics
-- This schema represents the dynamic transactional tables in MySQL.

CREATE DATABASE IF NOT EXISTS astromart_logistics;
USE astromart_logistics;

-- 1. shipments: Tracks active shipments of equipment to different space stations/outposts
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    destination VARCHAR(100) NOT NULL,
    equipment_id VARCHAR(50) NOT NULL, -- Links to static equipment_catalog.csv
    quantity INT NOT NULL,
    shipment_status ENUM('Scheduled', 'In-Transit', 'Delivered', 'Delayed') DEFAULT 'Scheduled',
    departure_date DATETIME NOT NULL,
    arrival_date DATETIME
);

-- 2. inventory_status: Tracks live warehousing information for each equipment item
CREATE TABLE IF NOT EXISTS inventory_status (
    equipment_id VARCHAR(50) PRIMARY KEY, -- Links to static equipment_catalog.csv
    warehouse_bay VARCHAR(20) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    last_inspected DATETIME NOT NULL
);

-- 3. Create a view to easily join shipment status with warehouse locations
CREATE OR REPLACE VIEW view_active_logistics AS
SELECT 
    s.shipment_id,
    s.destination,
    s.equipment_id,
    s.quantity,
    s.shipment_status,
    i.warehouse_bay,
    i.current_stock
FROM shipments s
LEFT JOIN inventory_status i ON s.equipment_id = i.equipment_id;
