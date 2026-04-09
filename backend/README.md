Ecco il riepilogo completo:

**Trip**
- id (PK)
- title
- description
- start_date
- end_date
- destination
- cover_image

**Day**
- id (PK)
- trip_id (FK → Trip.id)
- day_date
- location
- notes

**Activity**
- id (PK)
- day_id (FK → Day.id)
- title
- description
- start_time
- end_time
- location
- status (enum)
- costo
- metodo_pagamento
- data_cancellazione
- link
- notes

**Accommodation**
- id (PK)
- trip_id (FK → Trip.id)
- type (enum)
- name
- location
- checkin_date
- checkout_date
- status (enum)
- costo
- metodo_pagamento
- data_cancellazione
- link
- extra_details (JSON)
- notes

**Flight**
- id (PK)
- trip_id (FK → Trip.id)
- departure_airport
- arrival_airport
- departure_datetime
- arrival_datetime
- company
- flight_number
- baggage_included (bool)
- status (enum)
- costo
- metodo_pagamento
- link

**Transport**
- id (PK)
- trip_id (FK → Trip.id)
- type (enum)
- departure_location
- arrival_location
- departure_datetime
- arrival_datetime
- extra_details (JSON)
- status (enum)
- costo
- metodo_pagamento
- link

**PackingItem**
- id (PK)
- trip_id (FK → Trip.id)
- name
- category (enum)
- checked (bool)
- notes

**Budget**
- id (PK)
- trip_id (FK → Trip.id)
- category (enum)
- description
- amount
- is_estimated (bool)
- actual_amount

---

**Relazioni**
- Trip 1:N Day
- Trip 1:N Flight
- Trip 1:N Accommodation
- Trip 1:N Transport
- Trip 1:N PackingItem
- Trip 1:N Budget
- Day 1:N Activity

---

**Enum da definire**
- `status` → draft / to_book / booked / cancelled / completed — usato da Activity, Accommodation, Flight, Transport
- `accommodation_type` → hotel / hostel / airbnb / lodge / camping / resort / apartment / extras
- `transport_type` → train / bus / car / shuttle / ferry / taxi
- `packing_category` → documents / clothing / medicine / technology / extras
- `budget_category` → accommodation / transport / activities / food / shopping / extras