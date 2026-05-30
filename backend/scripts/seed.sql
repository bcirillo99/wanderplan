-- TRIP
INSERT INTO trips (id, title, description, start_date, end_date, destination, cover_image, notes)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Weekend lungo a Parigi',
    'Fuga romantica/culturale a Parigi di 4 giorni',
    '2026-06-05', '2026-06-08',
    'Parigi, Francia',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    'Ricordarsi di prenotare i musei con largo anticipo.'
);

-- FLIGHTS
INSERT INTO flights (id, trip_id, flight_number, baggage_included, status, cost, pay_method, link, origin, destination, departure_time, arrival_time, airline, booking_reference, notes, stops, legs)
VALUES
(
    'f1111111-2222-3333-4444-555555555555',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'AF1413', TRUE, 'booked', 145.50, 'Carta di Credito Nexus',
    'https://www.airfrance.it',
    'Milano Malpensa (MXP)', 'Parigi Charles de Gaulle (CDG)',
    '2026-06-05 07:15:00', '2026-06-05 08:45:00',
    'Air France', 'AFXYZ789', 'Bagaglio a mano in cappelliera incluso.', 0, '[]'::jsonb
),
(
    'f2222222-2222-3333-4444-555555555555',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'AF1414', TRUE, 'booked', 120.00, 'Carta di Credito Nexus',
    'https://www.airfrance.it',
    'Parigi Charles de Gaulle (CDG)', 'Milano Malpensa (MXP)',
    '2026-06-08 20:30:00', '2026-06-08 22:00:00',
    'Air France', 'AFXYZ890', 'Occhio ai controlli liquidi a CDG.', 0, '[]'::jsonb
);

-- TRANSPORTS
INSERT INTO transports (id, trip_id, status, cost, pay_method, link, extra_details, notes, transport_type, origin, destination, departure_time, arrival_time, operator, booking_reference)
VALUES
(
    'b1111111-2222-3333-4444-555555555555',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'to_book', 11.80, 'Contanti/Self-service', NULL, '{}'::jsonb,
    'Biglietto treno RER B acquistabile in stazione.',
    'train', 'CDG Airport', 'Paris Châtelet les Halles',
    '2026-06-05 09:30:00', '2026-06-05 10:15:00', 'RATP', NULL
),
(
    'b2222222-2222-3333-4444-555555555555',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'draft', 55.00, 'App G7', NULL, '{}'::jsonb,
    'Tariffa fissa taxi riva destra per CDG.',
    'taxi', 'Le Marais', 'CDG Airport',
    '2026-06-08 17:30:00', '2026-06-08 18:30:00', 'G7 Taxi', NULL
);

-- ACCOMMODATION
INSERT INTO accommodations (id, trip_id, name, location, status, pay_method, cancellation_date, link, extra_details, notes, accommodation_type, address, check_in, check_out, cost_per_night, booking_reference)
VALUES (
    'ac111111-2222-3333-4444-555555555555',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Charming Apartment in Le Marais', 'Le Marais, 4th Arr.',
    'booked', 'PayPal', '2026-06-01',
    'https://www.airbnb.com/rooms/123456',
    '{"host": "Jean-Pierre", "code": "45A92"}'::jsonb,
    'Codice della porta comunicato dall host il giorno prima.',
    'apartment', '12 Rue des Rosiers, 75004 Paris, France',
    '2026-06-05', '2026-06-08', 140.00, 'HM-2026-PARIS'
);

-- ACTIVITIES
INSERT INTO activities (id, title, description, start_time, end_time, location, status, cost, pay_method, cancellation_date, link, notes, trip_id, activity_date)
VALUES
('ac111111-1111-1111-1111-111111111111', 'Visita al Museo del Louvre', 'Ingresso prioritario con slot orario prenotato.', '14:00:00', '17:30:00', 'Musée du Louvre', 'booked', 22.00, 'Carta di Credito', '2026-06-04', 'https://www.louvre.fr', 'Entrare dall ingresso del Carrousel per evitare le code.', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-06-05'),
('ac222222-2222-2222-2222-222222222222', 'Crociera sulla Senna al tramonto', 'Giro in battello di 1 ora partendo dal Pont Neuf.', '20:30:00', '21:30:00', 'Vedettes du Pont Neuf', 'to_book', 15.00, NULL, NULL, 'https://www.vedettesdupontneuf.com', 'Splendida vista sulla Tour Eiffel illuminata.', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-06-05'),
('ac333333-3333-3333-3333-333333333333', 'Salita sulla Tour Eiffel', 'Biglietto per il vertice tramite ascensore.', '09:30:00', '12:30:00', 'Champ de Mars', 'booked', 29.40, 'Carta di Credito', NULL, 'https://www.toureiffel.paris', 'Presentarsi 30 minuti prima per i controlli.', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-06-06'),
('ac444444-4444-4444-4444-444444444444', 'Passeggiata guidata a Montmartre', 'Tour a piedi libero con guida locale.', '15:30:00', '18:00:00', 'Place Blanche (fronte Moulin Rouge)', 'booked', 0.00, 'Gratuito / Mancia', NULL, 'https://www.guruwalk.com', 'Ritrovo davanti all uscita della metro Blanche.', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-06-06'),
('ac555555-5555-5555-5555-555555555555', 'Museo d Orsay', 'Collezione impressionisti e post-impressionisti.', '10:00:00', '13:00:00', 'Esplanade Valéry Giscard d Estaing', 'booked', 16.00, 'Carta di Credito', NULL, 'https://www.musee-orsay.fr', 'Verificare apertura lunedì per il 2026.', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-06-08');

-- PACKING ITEMS
INSERT INTO packing_items (id, trip_id, name, category, checked, notes)
VALUES
('b0111111-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Passaporto / Carta d identità', 'documents', TRUE, 'Controllare validità.'),
('b0222222-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Scarpe comode per camminare', 'clothing', TRUE, 'Fondamentali per i pavimenti in pavé.'),
('b0333333-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Adattatore presa / Powerbank', 'technology', FALSE, 'Powerbank serve per le lunghe giornate fuori.'),
('b0444444-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Ombrello tascabile', 'extras', FALSE, 'Meteo instabile a inizio giugno.');

-- NOTES
INSERT INTO notes (id, trip_id, created_at, text)
VALUES
('b0b11111-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-05-28 18:30:00+00', 'Scarica l applicazione Bonjour RATP per i trasporti pubblici prima di arrivare.'),
('b0b22222-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2026-05-29 09:00:00+00', 'Domenica 7 giugno lasciata libera: mercatini di Le Marais, parchi e canale Saint-Martin.');

-- EXTRAS
INSERT INTO extras (id, trip_id, category, description, amount, is_estimated, actual_amount, currency, notes)
VALUES
('e1111111-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'food', 'Budget stimato per cene, bistrot e boulangerie', 250.00, TRUE, NULL, 'EUR', 'Circa 60-70 euro al giorno.'),
('e2222222-2222-3333-4444-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'shopping', 'Souvenir e macarons da riportare a casa', 40.00, FALSE, 38.50, 'EUR', 'Presi da Ladurée.');
