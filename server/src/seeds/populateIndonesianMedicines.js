const db = require('../config/database');

const INDONESIAN_MEDICINES = [
  // ─── 1. ANALGESIK & OBAT FLU/BATUK POPULER ───
  {
    code: 'MED-PAN-BLU',
    name: 'Panadol Biru (Paracetamol 500mg)',
    category: 'padat',
    base_unit: 'Kaplet',
    total_stock: 450,
    min_stock_alert: 30,
    rack_location: 'Rak A-01',
    contraindications: 'Gangguan Fungsi Hati Berat',
    bpom_nie: 'DBL9804414210A1',
    barcode: '8992753011402',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Blister', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-PAN-2027A', expired_date: '2027-11-30', stock_qty: 250, distributor: 'GlaxoSmithKline / Sterling' },
      { batch_number: 'BCH-PAN-2028B', expired_date: '2028-05-15', stock_qty: 200, distributor: 'Enseval Putera Megatrading' }
    ]
  },
  {
    code: 'MED-PAN-RED',
    name: 'Panadol Merah Extra (Paracetamol + Kafein)',
    category: 'padat',
    base_unit: 'Kaplet',
    total_stock: 320,
    min_stock_alert: 30,
    rack_location: 'Rak A-01',
    contraindications: 'Insomnia Akut, Aritmia Jantung Berat',
    bpom_nie: 'DTL9504414110A1',
    barcode: '8992753011426',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Blister', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-PNX-2027C', expired_date: '2027-10-20', stock_qty: 320, distributor: 'GlaxoSmithKline' }
    ]
  },
  {
    code: 'MED-BDX-REG',
    name: 'Bodrex Tablet (Paracetamol + Kafein)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 500,
    min_stock_alert: 40,
    rack_location: 'Rak A-02',
    contraindications: 'Gangguan Hati dan Ginjal Berat',
    bpom_nie: 'DBL7622702710A1',
    barcode: '8992695123010',
    units: [
      { unit_name: 'Box', conversion_ratio: 200 },
      { unit_name: 'Strip', conversion_ratio: 20 }
    ],
    batches: [
      { batch_number: 'BCH-BDX-2027X', expired_date: '2027-08-31', stock_qty: 500, distributor: 'Tempo Scan Pacific' }
    ]
  },
  {
    code: 'MED-BDX-MIG',
    name: 'Bodrex Migra',
    category: 'padat',
    base_unit: 'Kaplet',
    total_stock: 240,
    min_stock_alert: 25,
    rack_location: 'Rak A-02',
    contraindications: 'Hipertensi Berat, Stroke',
    bpom_nie: 'DBL9322711010A1',
    barcode: '8992695123027',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 4 }
    ],
    batches: [
      { batch_number: 'BCH-BMG-2027B', expired_date: '2027-12-15', stock_qty: 240, distributor: 'Tempo Scan Pacific' }
    ]
  },
  {
    code: 'MED-SNM-TAB',
    name: 'Sanmol Tablet 500mg',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 600,
    min_stock_alert: 50,
    rack_location: 'Rak A-03',
    contraindications: 'Hipersensitivitas Paracetamol',
    bpom_nie: 'DBL7622235610A1',
    barcode: '8992745100015',
    units: [
      { unit_name: 'Box', conversion_ratio: 250 },
      { unit_name: 'Strip', conversion_ratio: 4 }
    ],
    batches: [
      { batch_number: 'BCH-SNM-2027A', expired_date: '2027-09-30', stock_qty: 600, distributor: 'Sanbe Farma' }
    ]
  },
  {
    code: 'MED-SNM-SYR',
    name: 'Sanmol Sirup 60ml (120mg/5ml)',
    category: 'cair',
    base_unit: 'Botol',
    total_stock: 45,
    min_stock_alert: 15,
    rack_location: 'Rak C-01',
    contraindications: 'Gagal Hati Terminal',
    bpom_nie: 'DBL7622235637A1',
    barcode: '8992745200029',
    units: [
      { unit_name: 'Karton', conversion_ratio: 24 }
    ],
    batches: [
      { batch_number: 'BCH-SNS-2027F', expired_date: '2027-07-20', stock_qty: 45, distributor: 'Sanbe Farma' }
    ]
  },
  {
    code: 'MED-BIO-500',
    name: 'Biogesic 500mg',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 300,
    min_stock_alert: 30,
    rack_location: 'Rak A-03',
    contraindications: 'Gagal Hati',
    bpom_nie: 'DBL9114704710A1',
    barcode: '8998838110019',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 4 }
    ],
    batches: [
      { batch_number: 'BCH-BIO-2028A', expired_date: '2028-02-28', stock_qty: 300, distributor: 'Darya-Varia Laboratoria' }
    ]
  },
  {
    code: 'MED-PRM-TAB',
    name: 'Paramex Tablet Sakit Kepala',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 400,
    min_stock_alert: 40,
    rack_location: 'Rak A-04',
    contraindications: 'Ulkus Peptikum, Alergi Propyphenazone',
    bpom_nie: 'DTL7813003810A1',
    barcode: '8992696110019',
    units: [
      { unit_name: 'Box', conversion_ratio: 200 },
      { unit_name: 'Strip', conversion_ratio: 4 }
    ],
    batches: [
      { batch_number: 'BCH-PRM-2027D', expired_date: '2027-10-15', stock_qty: 400, distributor: 'Konimex' }
    ]
  },
  {
    code: 'MED-MXG-FLU',
    name: 'Mixagrip Flu & Batuk',
    category: 'padat',
    base_unit: 'Kaplet',
    total_stock: 350,
    min_stock_alert: 35,
    rack_location: 'Rak A-04',
    contraindications: 'Glaukoma Sudut Tertutup, Hipertensi Berat',
    bpom_nie: 'DTL0404423804A1',
    barcode: '8992752100015',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 4 }
    ],
    batches: [
      { batch_number: 'BCH-MXG-2027K', expired_date: '2027-11-20', stock_qty: 350, distributor: 'Kalbe Farma' }
    ]
  },
  {
    code: 'MED-DCL-TAB',
    name: 'Decolgen Tablet Flu',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 280,
    min_stock_alert: 25,
    rack_location: 'Rak A-04',
    contraindications: 'Hipertensi Berat, Penyakit Jantung Iskemik',
    bpom_nie: 'DTL7214702310A1',
    barcode: '8998838200017',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 4 }
    ],
    batches: [
      { batch_number: 'BCH-DCL-2028C', expired_date: '2028-03-10', stock_qty: 280, distributor: 'Darya-Varia' }
    ]
  },
  {
    code: 'MED-PCD-FLU',
    name: 'Procold Flu & Batuk',
    category: 'padat',
    base_unit: 'Kaplet',
    total_stock: 250,
    min_stock_alert: 25,
    rack_location: 'Rak A-04',
    contraindications: 'Hipertiroidisme, Hipertensi',
    bpom_nie: 'DTL1122721810A1',
    barcode: '8992695300015',
    units: [
      { unit_name: 'Box', conversion_ratio: 144 },
      { unit_name: 'Strip', conversion_ratio: 6 }
    ],
    batches: [
      { batch_number: 'BCH-PCD-2027M', expired_date: '2027-08-25', stock_qty: 250, distributor: 'Kalbe Farma' }
    ]
  },
  {
    code: 'MED-TLK-ANG',
    name: 'Tolak Angin Cair Herbal Sido Muncul',
    category: 'cair',
    base_unit: 'Sachet',
    total_stock: 600,
    min_stock_alert: 60,
    rack_location: 'Rak C-05',
    contraindications: 'Wanita Hamil dan Menyusui',
    bpom_nie: 'TR032622221',
    barcode: '8998888123012',
    units: [
      { unit_name: 'Box', conversion_ratio: 12 }
    ],
    batches: [
      { batch_number: 'BCH-TLK-2028X', expired_date: '2028-06-30', stock_qty: 600, distributor: 'Sido Muncul' }
    ]
  },
  {
    code: 'MED-ATG-JRG',
    name: 'Antangin JRG Cair Sachet',
    category: 'cair',
    base_unit: 'Sachet',
    total_stock: 480,
    min_stock_alert: 48,
    rack_location: 'Rak C-05',
    contraindications: 'Alergi Bahan Herbal Jahe',
    bpom_nie: 'HT122600301',
    barcode: '8992752200012',
    units: [
      { unit_name: 'Box', conversion_ratio: 12 }
    ],
    batches: [
      { batch_number: 'BCH-ATG-2028A', expired_date: '2028-04-18', stock_qty: 480, distributor: 'Deltomed Laboratories' }
    ]
  },
  {
    code: 'MED-KMX-HRB',
    name: 'Komix Herbal Peppermint',
    category: 'cair',
    base_unit: 'Tube/Sachet',
    total_stock: 360,
    min_stock_alert: 30,
    rack_location: 'Rak C-05',
    contraindications: 'Hipersensitivitas',
    bpom_nie: 'TR142679261',
    barcode: '8992741100018',
    units: [
      { unit_name: 'Box', conversion_ratio: 6 }
    ],
    batches: [
      { batch_number: 'BCH-KMX-2027P', expired_date: '2027-10-10', stock_qty: 360, distributor: 'Bintang Toedjoe' }
    ]
  },

  // ─── 2. OBAT LAMBUNG, MAAG & GASTROINTESTINAL ───
  {
    code: 'MED-PMG-TAB',
    name: 'Promag Tablet Kunyah (Hydrotalcite)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 700,
    min_stock_alert: 50,
    rack_location: 'Rak A-06',
    contraindications: 'Gagal Ginjal Berat (Kadar Magnesium Tinggi)',
    bpom_nie: 'DBL9111601963A1',
    barcode: '8992695400012',
    units: [
      { unit_name: 'Box', conversion_ratio: 30 },
      { unit_name: 'Blister', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-PMG-2027Y', expired_date: '2027-12-31', stock_qty: 700, distributor: 'Kalbe Farma' }
    ]
  },
  {
    code: 'MED-PMG-SUS',
    name: 'Promag Cair Sachet 7ml',
    category: 'cair',
    base_unit: 'Sachet',
    total_stock: 300,
    min_stock_alert: 30,
    rack_location: 'Rak C-02',
    contraindications: 'Insufisiensi Ginjal Kronik',
    bpom_nie: 'DBL1111641036A1',
    barcode: '8992695400029',
    units: [
      { unit_name: 'Box', conversion_ratio: 30 }
    ],
    batches: [
      { batch_number: 'BCH-PMS-2028B', expired_date: '2028-02-14', stock_qty: 300, distributor: 'Kalbe Farma' }
    ]
  },
  {
    code: 'MED-MYL-TAB',
    name: 'Mylanta Tablet Kunyah',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 400,
    min_stock_alert: 40,
    rack_location: 'Rak A-06',
    contraindications: 'Penyakit Ginjal Stadium Akhir',
    bpom_nie: 'DBL7004414510A1',
    barcode: '8999999056012',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-MYL-2027H', expired_date: '2027-09-18', stock_qty: 400, distributor: 'Johnson & Johnson / Kenvue' }
    ]
  },
  {
    code: 'MED-MYL-SYR',
    name: 'Mylanta Sirup Suspensi 150ml',
    category: 'cair',
    base_unit: 'Botol',
    total_stock: 35,
    min_stock_alert: 10,
    rack_location: 'Rak C-02',
    contraindications: 'Hipofosfatemia, Gagal Ginjal',
    bpom_nie: 'DBL7004414533A1',
    barcode: '8999999056029',
    units: [
      { unit_name: 'Karton', conversion_ratio: 12 }
    ],
    batches: [
      { batch_number: 'BCH-MYS-2027D', expired_date: '2027-08-22', stock_qty: 35, distributor: 'Johnson & Johnson' }
    ]
  },
  {
    code: 'MED-ATD-DOEN',
    name: 'Antasida Doen Tablet Kunyah',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 800,
    min_stock_alert: 60,
    rack_location: 'Rak A-06',
    contraindications: 'Gagal Ginjal Berat',
    bpom_nie: 'GBL9604415010A1',
    barcode: '8999999009010',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-ATD-2028G', expired_date: '2028-03-31', stock_qty: 800, distributor: 'Kimia Farma Trading' }
    ]
  },
  {
    code: 'MED-DPT-KAP',
    name: 'Diapet Kapsul (Ekstrak Daun Jambu)',
    category: 'padat',
    base_unit: 'Kapsul',
    total_stock: 420,
    min_stock_alert: 30,
    rack_location: 'Rak A-08',
    contraindications: 'Diare Berdarah / Disentri Akut',
    bpom_nie: 'TR962384791',
    barcode: '8992755100019',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-DPT-2027W', expired_date: '2027-11-15', stock_qty: 420, distributor: 'Soho Industri Pharmasi' }
    ]
  },
  {
    code: 'MED-ENT-TAB',
    name: 'Entrostop Tablet (Attapulgite + Pektin)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 360,
    min_stock_alert: 30,
    rack_location: 'Rak A-08',
    contraindications: 'Obstruksi Usus, Alergi Attapulgite',
    bpom_nie: 'DBL7211603510A1',
    barcode: '8992695500019',
    units: [
      { unit_name: 'Box', conversion_ratio: 120 },
      { unit_name: 'Blister', conversion_ratio: 12 }
    ],
    batches: [
      { batch_number: 'BCH-ENT-2028A', expired_date: '2028-05-20', stock_qty: 360, distributor: 'Kalbe Farma' }
    ]
  },
  {
    code: 'MED-ORL-200',
    name: 'Oralit 200ml Sachet Garam Rehidrasi',
    category: 'padat',
    base_unit: 'Sachet',
    total_stock: 500,
    min_stock_alert: 50,
    rack_location: 'Rak A-08',
    contraindications: 'Anuria, Dehidrasi Berat Syok',
    bpom_nie: 'GBL9819920823A1',
    barcode: '8999999010016',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 }
    ],
    batches: [
      { batch_number: 'BCH-ORL-2028X', expired_date: '2028-07-31', stock_qty: 500, distributor: 'Phapros' }
    ]
  },
  {
    code: 'MED-OMP-20',
    name: 'Omeprazole 20mg Kapsul',
    category: 'padat',
    base_unit: 'Kapsul',
    total_stock: 500,
    min_stock_alert: 40,
    rack_location: 'Rak B-02',
    contraindications: 'Penggunaan bersamaan dengan Rilpivirine',
    bpom_nie: 'GKL0304415201A1',
    barcode: '8999999012010',
    units: [
      { unit_name: 'Box', conversion_ratio: 30 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-OMP-2027R', expired_date: '2027-12-10', stock_qty: 500, distributor: 'Novell Pharmaceutical' }
    ]
  },
  {
    code: 'MED-LNS-30',
    name: 'Lansoprazole 30mg Kapsul',
    category: 'padat',
    base_unit: 'Kapsul',
    total_stock: 350,
    min_stock_alert: 30,
    rack_location: 'Rak B-02',
    contraindications: 'Hipersensitivitas PPI',
    bpom_nie: 'GKL0504415301A1',
    barcode: '8999999013017',
    units: [
      { unit_name: 'Box', conversion_ratio: 20 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-LNS-2028K', expired_date: '2028-04-30', stock_qty: 350, distributor: 'Dexa Medica' }
    ]
  },

  // ─── 3. TOPIKAL, SALEP, TETES MATA & ANTISEPTIK ───
  {
    code: 'MED-BTD-60',
    name: 'Betadine Antiseptic Solution 60ml',
    category: 'cair',
    base_unit: 'Botol',
    total_stock: 60,
    min_stock_alert: 15,
    rack_location: 'Rak D-02',
    contraindications: 'Alergi Iodium, Gangguan Tiroid',
    bpom_nie: 'DKL7614704041A1',
    barcode: '8992760100012',
    units: [
      { unit_name: 'Karton', conversion_ratio: 24 }
    ],
    batches: [
      { batch_number: 'BCH-BTD-2028A', expired_date: '2028-08-31', stock_qty: 60, distributor: 'Mundipharma' }
    ]
  },
  {
    code: 'MED-BPL-GEL',
    name: 'Bioplacenton Gel Luka Bakar 15g',
    category: 'salep',
    base_unit: 'Tube',
    total_stock: 80,
    min_stock_alert: 20,
    rack_location: 'Rak D-03',
    contraindications: 'Hipersensitivitas Neomycin',
    bpom_nie: 'DKL7211601728A1',
    barcode: '8992756100018',
    units: [
      { unit_name: 'Box', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-BPL-2027M', expired_date: '2027-10-25', stock_qty: 80, distributor: 'Kalbe Farma' }
    ]
  },
  {
    code: 'MED-SLP-88',
    name: 'Salep Kulit 88 (Antijamur & Gatal) 6g',
    category: 'salep',
    base_unit: 'Pot',
    total_stock: 120,
    min_stock_alert: 25,
    rack_location: 'Rak D-04',
    contraindications: 'Luka Terbuka Luas',
    bpom_nie: 'QD191716891',
    barcode: '8992789100012',
    units: [
      { unit_name: 'Lusin', conversion_ratio: 12 }
    ],
    batches: [
      { batch_number: 'BCH-S88-2028J', expired_date: '2028-11-20', stock_qty: 120, distributor: 'Meccaya Pharma' }
    ]
  },
  {
    code: 'MED-IST-REG',
    name: 'Insto Regular Tetes Mata 7.5ml',
    category: 'cair',
    base_unit: 'Botol',
    total_stock: 90,
    min_stock_alert: 20,
    rack_location: 'Rak D-05',
    contraindications: 'Glaukoma Sudut Tertutup',
    bpom_nie: 'DTL1438202046A1',
    barcode: '8998838300014',
    units: [
      { unit_name: 'Box', conversion_ratio: 12 }
    ],
    batches: [
      { batch_number: 'BCH-IST-2027E', expired_date: '2027-09-15', stock_qty: 90, distributor: 'Combiphar' }
    ]
  },
  {
    code: 'MED-RHT-REG',
    name: 'Rohto Tetes Mata Steril 7ml',
    category: 'cair',
    base_unit: 'Botol',
    total_stock: 65,
    min_stock_alert: 15,
    rack_location: 'Rak D-05',
    contraindications: 'Penggunaan Bersama Lensa Kontak Lunak',
    bpom_nie: 'DTL1122246746A1',
    barcode: '8992778100013',
    units: [
      { unit_name: 'Box', conversion_ratio: 12 }
    ],
    batches: [
      { batch_number: 'BCH-RHT-2028B', expired_date: '2028-01-30', stock_qty: 65, distributor: 'Rohto Laboratories Indonesia' }
    ]
  },
  {
    code: 'MED-MKP-60',
    name: 'Minyak Kayu Putih Cap Lang 60ml',
    category: 'cair',
    base_unit: 'Botol',
    total_stock: 75,
    min_stock_alert: 15,
    rack_location: 'Rak C-06',
    contraindications: 'Iritasi Kulit Terbuka',
    bpom_nie: 'TR142679841',
    barcode: '8992765100019',
    units: [
      { unit_name: 'Lusin', conversion_ratio: 12 }
    ],
    batches: [
      { batch_number: 'BCH-MKP-2028L', expired_date: '2028-12-31', stock_qty: 75, distributor: 'Eagle Indo Pharma' }
    ]
  },
  {
    code: 'MED-SLP-KYO',
    name: 'Salonpas Koyo Pereda Nyeri (Isi 10)',
    category: 'padat',
    base_unit: 'Sachet',
    total_stock: 200,
    min_stock_alert: 25,
    rack_location: 'Rak D-06',
    contraindications: 'Luka Bakar, Ruam Terbuka',
    bpom_nie: 'QL031800111',
    barcode: '8992790100018',
    units: [
      { unit_name: 'Box', conversion_ratio: 20 }
    ],
    batches: [
      { batch_number: 'BCH-SLP-2027Z', expired_date: '2027-11-28', stock_qty: 200, distributor: 'Hisamitsu Pharma Indonesia' }
    ]
  },

  // ─── 4. VITAMIN & SUPLEMEN KESEHATAN ───
  {
    code: 'MED-ENV-C',
    name: 'Enervon-C Multivitamin Strip (Isi 4)',
    category: 'padat',
    base_unit: 'Strip',
    total_stock: 350,
    min_stock_alert: 40,
    rack_location: 'Rak E-01',
    contraindications: 'Batu Ginjal Kalsium Oksalat',
    bpom_nie: 'SD011500981',
    barcode: '8998838400011',
    units: [
      { unit_name: 'Box', conversion_ratio: 25 }
    ],
    batches: [
      { batch_number: 'BCH-ENV-2028C', expired_date: '2028-06-15', stock_qty: 350, distributor: 'Darya-Varia Laboratoria' }
    ]
  },
  {
    code: 'MED-SNG-KAP',
    name: 'Sangobion Kapsul Penambah Darah',
    category: 'padat',
    base_unit: 'Kapsul',
    total_stock: 400,
    min_stock_alert: 40,
    rack_location: 'Rak E-02',
    contraindications: 'Hemokromatosis, Anemia Hemolitik',
    bpom_nie: 'DBL8815801601A1',
    barcode: '8992785100013',
    units: [
      { unit_name: 'Box', conversion_ratio: 40 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-SNG-2027F', expired_date: '2027-10-31', stock_qty: 400, distributor: 'Merck / P&G Health' }
    ]
  },
  {
    code: 'MED-IMB-FRC',
    name: 'Imboost Force Tablet Daya Tahan Tubuh',
    category: 'padat',
    base_unit: 'Kaplet',
    total_stock: 250,
    min_stock_alert: 30,
    rack_location: 'Rak E-03',
    contraindications: 'Penyakit Autoimun, Tuberkulosis Aktif',
    bpom_nie: 'SD021503871',
    barcode: '8992757100015',
    units: [
      { unit_name: 'Box', conversion_ratio: 30 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-IMB-2028A', expired_date: '2028-03-22', stock_qty: 250, distributor: 'Soho Industri Pharmasi' }
    ]
  },

  // ─── 5. OBAT KRONIS & GENERIK KLINIS (Darah Tinggi, Gula, Asam Urat) ───
  {
    code: 'MED-AML-05',
    name: 'Amlodipine 5mg Tablet (Generik)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 900,
    min_stock_alert: 80,
    rack_location: 'Rak B-05',
    contraindications: 'Hipotensi Berat, Syok Kardiogenik',
    bpom_nie: 'GKL1204415910A1',
    barcode: '8999999019019',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-AML-2028V', expired_date: '2028-07-15', stock_qty: 900, distributor: 'Kimia Farma Trading' }
    ]
  },
  {
    code: 'MED-AML-10',
    name: 'Amlodipine 10mg Tablet (Generik)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 650,
    min_stock_alert: 60,
    rack_location: 'Rak B-05',
    contraindications: 'Hipotensi Berat, Syok Kardiogenik',
    bpom_nie: 'GKL1204415910B1',
    barcode: '8999999020015',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-AML-2028W', expired_date: '2028-08-20', stock_qty: 650, distributor: 'Kimia Farma Trading' }
    ]
  },
  {
    code: 'MED-MTF-500',
    name: 'Metformin HCl 500mg Tablet (Generik)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 850,
    min_stock_alert: 70,
    rack_location: 'Rak B-06',
    contraindications: 'Asidosis Laktat Akut, Gangguan Ginjal eGFR < 30',
    bpom_nie: 'GKL1504416210A1',
    barcode: '8999999023016',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-MTF-2028H', expired_date: '2028-09-30', stock_qty: 850, distributor: 'Dexa Medica' }
    ]
  },
  {
    code: 'MED-GLM-02',
    name: 'Glimepiride 2mg Tablet (Generik)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 450,
    min_stock_alert: 40,
    rack_location: 'Rak B-06',
    contraindications: 'Diabetes Mellitus Tipe 1, Ketoasidosis',
    bpom_nie: 'GKL1604416310A1',
    barcode: '8999999024013',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-GLM-2027M', expired_date: '2027-11-18', stock_qty: 450, distributor: 'Sanbe Farma' }
    ]
  },
  {
    code: 'MED-SMV-20',
    name: 'Simvastatin 20mg Tablet (Generik Kolesterol)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 550,
    min_stock_alert: 50,
    rack_location: 'Rak B-07',
    contraindications: 'Penyakit Hati Aktif, Ibu Hamil dan Menyusui',
    bpom_nie: 'GKL1704416410B1',
    barcode: '8999999026017',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-SMV-2028R', expired_date: '2028-05-10', stock_qty: 550, distributor: 'Bernofarm' }
    ]
  },
  {
    code: 'MED-ALP-100',
    name: 'Allopurinol 100mg Tablet (Generik Asam Urat)',
    category: 'padat',
    base_unit: 'Tablet',
    total_stock: 500,
    min_stock_alert: 40,
    rack_location: 'Rak B-07',
    contraindications: 'Serangan Gout Akut Mendadak',
    bpom_nie: 'GKL1804416510A1',
    barcode: '8999999027014',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-ALP-2028T', expired_date: '2028-10-15', stock_qty: 500, distributor: 'Kimia Farma Trading' }
    ]
  },
  {
    code: 'MED-CPX-500',
    name: 'Ciprofloxacin 500mg (Antibiotik Resep)',
    category: 'padat',
    base_unit: 'Kaplet',
    total_stock: 350,
    min_stock_alert: 35,
    rack_location: 'Rak B-03',
    contraindications: 'Hipersensitivitas Quinolone, Tendinitis',
    bpom_nie: 'GKL0604415410A1',
    barcode: '8999999014014',
    units: [
      { unit_name: 'Box', conversion_ratio: 100 },
      { unit_name: 'Strip', conversion_ratio: 10 }
    ],
    batches: [
      { batch_number: 'BCH-CPX-2027B', expired_date: '2027-12-20', stock_qty: 350, distributor: 'Enseval Putera Megatrading' }
    ]
  }
];

function populateIndonesianMedicines() {
  console.log(`Menginjeksikan ${INDONESIAN_MEDICINES.length} obat populer & esensial Indonesia ke database Klinik Almedika...`);

  const insertMed = db.prepare(`
    INSERT INTO medicines (code, name, category, base_unit, total_stock, min_stock_alert, rack_location, contraindications, bpom_nie, barcode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateMed = db.prepare(`
    UPDATE medicines SET 
      name = ?, 
      category = ?, 
      base_unit = ?, 
      total_stock = ?, 
      min_stock_alert = ?, 
      rack_location = ?, 
      contraindications = ?, 
      bpom_nie = ?, 
      barcode = ?
    WHERE code = ?
  `);

  const checkMed = db.prepare('SELECT id FROM medicines WHERE code = ?');
  const insertUnit = db.prepare(`
    INSERT INTO medicine_units (medicine_id, unit_name, conversion_ratio, is_base_unit)
    VALUES (?, ?, ?, ?)
  `);
  const checkUnit = db.prepare('SELECT id FROM medicine_units WHERE medicine_id = ? AND unit_name = ?');

  const insertBatch = db.prepare(`
    INSERT INTO medicine_batches (medicine_id, batch_number, expired_date, stock_qty, rack_location, distributor)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const checkBatch = db.prepare('SELECT id FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?');

  const tx = db.transaction(() => {
    let addedCount = 0;
    let updatedCount = 0;

    for (const med of INDONESIAN_MEDICINES) {
      const existing = checkMed.get(med.code);
      let medId;

      if (existing) {
        updateMed.run(
          med.name,
          med.category,
          med.base_unit,
          med.total_stock,
          med.min_stock_alert,
          med.rack_location,
          med.contraindications,
          med.bpom_nie,
          med.barcode,
          med.code
        );
        medId = existing.id;
        updatedCount++;
      } else {
        const info = insertMed.run(
          med.code,
          med.name,
          med.category,
          med.base_unit,
          med.total_stock,
          med.min_stock_alert,
          med.rack_location,
          med.contraindications,
          med.bpom_nie,
          med.barcode
        );
        medId = info.lastInsertRowid;
        addedCount++;
      }

      // Base unit
      if (!checkUnit.get(medId, med.base_unit)) {
        insertUnit.run(medId, med.base_unit, 1, 1);
      }

      // Extra units
      if (med.units && Array.isArray(med.units)) {
        for (const u of med.units) {
          if (!checkUnit.get(medId, u.unit_name)) {
            insertUnit.run(medId, u.unit_name, u.conversion_ratio, 0);
          }
        }
      }

      // Batches
      if (med.batches && Array.isArray(med.batches)) {
        for (const b of med.batches) {
          if (!checkBatch.get(medId, b.batch_number)) {
            insertBatch.run(medId, b.batch_number, b.expired_date, b.stock_qty, med.rack_location, b.distributor);
          }
        }
      }
    }

    return { addedCount, updatedCount };
  });

  const res = tx();
  console.log(`Sukses! ${res.addedCount} obat baru ditambahkan, ${res.updatedCount} obat diperbarui.`);
}

if (require.main === module) {
  populateIndonesianMedicines();
}

module.exports = populateIndonesianMedicines;
