-- Seed Data for AstroMart Supply Logistics Database
USE astromart_logistics;

-- Clear existing data
TRUNCATE TABLE shipments;
TRUNCATE TABLE inventory_status;

-- 1. Insert seed data into inventory_status
-- Links back to specific equipment_id values in the equipment_catalog.csv
INSERT INTO inventory_status (equipment_id, warehouse_bay, current_stock, last_inspected) VALUES
('EQ-001', 'Bay-A1', 4, '2026-05-18 08:30:00'),
('EQ-002', 'Bay-B3', 45, '2026-05-19 14:15:00'),
('EQ-003', 'Bay-C2', 12, '2026-05-15 11:00:00'),
('EQ-004', 'Bay-D1', 88, '2026-05-20 09:00:00'),
('EQ-005', 'Bay-A4', 0, '2026-05-10 16:45:00'),
('EQ-006', 'Bay-B1', 150, '2026-05-20 10:20:00'),
('EQ-007', 'Bay-A2', 8, '2026-05-17 13:00:00'),
('EQ-008', 'Bay-E5', 15, '2026-05-19 11:30:00'),
('EQ-009', 'Bay-F1', 2, '2026-05-16 07:15:00'),
('EQ-010', 'Bay-F4', 18, '2026-05-20 08:00:00'),
('EQ-011', 'Bay-C5', 22, '2026-05-14 15:30:00'),
('EQ-012', 'Bay-A3', 10, '2026-05-18 10:00:00'),
('EQ-013', 'Bay-D2', 114, '2026-05-20 09:15:00'),
('EQ-014', 'Bay-B4', 35, '2026-05-19 16:00:00'),
('EQ-015', 'Bay-E2', 29, '2026-05-19 10:45:00');

-- 2. Insert seed data into shipments
INSERT INTO shipments (shipment_id, destination, equipment_id, quantity, shipment_status, departure_date, arrival_date) VALUES
('SH-1001', 'Artemis Base Alpha (Moon)', 'EQ-001', 1, 'In-Transit', '2026-05-19 06:00:00', NULL),
('SH-1002', 'Ares Outpost (Mars)', 'EQ-003', 4, 'Scheduled', '2026-05-22 04:00:00', NULL),
('SH-1003', 'ISS Legacy Orbit', 'EQ-006', 20, 'Delivered', '2026-05-18 10:00:00', '2026-05-18 18:30:00'),
('SH-1004', 'Titan Deep Space Hub', 'EQ-008', 2, 'Delayed', '2026-05-15 12:00:00', NULL),
('SH-1005', 'Artemis Base Alpha (Moon)', 'EQ-010', 3, 'In-Transit', '2026-05-19 06:00:00', NULL),
('SH-1006', 'Ares Outpost (Mars)', 'EQ-014', 10, 'Scheduled', '2026-05-22 04:00:00', NULL),
('SH-1007', 'Europa Sub-Surface Station', 'EQ-011', 5, 'In-Transit', '2026-05-17 01:00:00', NULL),
('SH-1008', 'Ganimede Hub', 'EQ-002', 15, 'Delivered', '2026-05-16 08:00:00', '2026-05-18 12:00:00');
