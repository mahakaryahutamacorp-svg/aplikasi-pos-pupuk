<?php
// CV. Maju Bersama POS - PHP Backend API
// For Hostinger Shared Hosting

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/data.json';

// Initialize data file if not exists
if (!file_exists($dataFile)) {
    $initialData = [
        'pin' => '2103',
        'products' => [
            ['id' => 1, 'name' => 'Pupuk NPK 16-16-16', 'type' => 'pupuk', 'stock' => 100, 'unit' => 'kg', 'priceModal' => 10000, 'priceEcer' => 15000, 'priceGrosir' => 13000],
            ['id' => 2, 'name' => 'Pupuk Urea', 'type' => 'pupuk', 'stock' => 150, 'unit' => 'kg', 'priceModal' => 8000, 'priceEcer' => 12000, 'priceGrosir' => 10000],
            ['id' => 3, 'name' => 'Herbisida Roundup', 'type' => 'pestisida', 'stock' => 20, 'unit' => 'liter', 'priceModal' => 70000, 'priceEcer' => 85000, 'priceGrosir' => 78000]
        ],
        'customers' => [],
        'suppliers' => [],
        'transactions' => [],
        'purchases' => [],
        'ledgerEntries' => []
    ];
    file_put_contents($dataFile, json_encode($initialData, JSON_PRETTY_PRINT));
}

function getData() {
    global $dataFile;
    return json_decode(file_get_contents($dataFile), true);
}

function saveData($data) {
    global $dataFile;
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
}

function getNextId($array) {
    if (empty($array)) return 1;
    return max(array_column($array, 'id')) + 1;
}

$uri = $_SERVER['REQUEST_URI'];
$uri = parse_url($uri, PHP_URL_PATH);
$uri = str_replace('/api.php', '', $uri);
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Route handling
$routes = explode('/', trim($uri, '/'));
$endpoint = $routes[0] ?? '';
$id = $routes[1] ?? null;
$subAction = $routes[2] ?? null;

$data = getData();

switch ($endpoint) {
    case 'auth':
        if ($id === 'login' && $method === 'POST') {
            if ($input['pin'] === $data['pin']) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'PIN salah']);
            }
        } elseif ($id === 'change-pin' && $method === 'POST') {
            if (strlen($input['newPin']) === 4) {
                $data['pin'] = $input['newPin'];
                saveData($data);
                echo json_encode(['success' => true]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'PIN harus 4 digit']);
            }
        }
        break;

    case 'products':
        if ($method === 'GET') {
            echo json_encode($data['products']);
        } elseif ($method === 'POST') {
            $newProduct = array_merge(['id' => getNextId($data['products'])], $input);
            $data['products'][] = $newProduct;
            saveData($data);
            echo json_encode($newProduct);
        } elseif ($method === 'PUT' && $id) {
            foreach ($data['products'] as &$p) {
                if ($p['id'] == $id) {
                    $p = array_merge($p, $input);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        } elseif ($method === 'PATCH' && $id && $subAction === 'stock') {
            foreach ($data['products'] as &$p) {
                if ($p['id'] == $id) {
                    $p['stock'] = $input['stock'];
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        } elseif ($method === 'DELETE' && $id) {
            $data['products'] = array_values(array_filter($data['products'], fn($p) => $p['id'] != $id));
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;

    case 'customers':
        if ($method === 'GET') {
            echo json_encode($data['customers']);
        } elseif ($method === 'POST') {
            $newItem = array_merge(['id' => getNextId($data['customers']), 'debt' => 0], $input);
            $data['customers'][] = $newItem;
            saveData($data);
            echo json_encode($newItem);
        } elseif ($method === 'PUT' && $id) {
            foreach ($data['customers'] as &$c) {
                if ($c['id'] == $id) {
                    $c = array_merge($c, $input);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        } elseif ($method === 'DELETE' && $id) {
            $data['customers'] = array_values(array_filter($data['customers'], fn($c) => $c['id'] != $id));
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;

    case 'suppliers':
        if ($method === 'GET') {
            echo json_encode($data['suppliers']);
        } elseif ($method === 'POST') {
            $newItem = array_merge(['id' => getNextId($data['suppliers']), 'debt' => 0], $input);
            $data['suppliers'][] = $newItem;
            saveData($data);
            echo json_encode($newItem);
        } elseif ($method === 'PUT' && $id) {
            foreach ($data['suppliers'] as &$s) {
                if ($s['id'] == $id) {
                    $s = array_merge($s, $input);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        } elseif ($method === 'DELETE' && $id) {
            $data['suppliers'] = array_values(array_filter($data['suppliers'], fn($s) => $s['id'] != $id));
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;

    case 'transactions':
        if ($method === 'GET') {
            echo json_encode($data['transactions']);
        } elseif ($method === 'POST') {
            $newItem = array_merge(['id' => getNextId($data['transactions'])], $input);
            $data['transactions'][] = $newItem;
            saveData($data);
            echo json_encode($newItem);
        }
        break;

    case 'purchases':
        if ($method === 'GET') {
            echo json_encode($data['purchases']);
        } elseif ($method === 'POST') {
            $newItem = array_merge(['id' => getNextId($data['purchases'])], $input);
            $data['purchases'][] = $newItem;
            saveData($data);
            echo json_encode($newItem);
        } elseif ($method === 'PUT' && $id) {
            foreach ($data['purchases'] as &$p) {
                if ($p['id'] == $id) {
                    $p = array_merge($p, $input);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        } elseif ($method === 'DELETE' && $id) {
            $data['purchases'] = array_values(array_filter($data['purchases'], fn($p) => $p['id'] != $id));
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;

    case 'ledger':
        if ($method === 'GET') {
            echo json_encode($data['ledgerEntries']);
        } elseif ($method === 'POST') {
            $newItem = array_merge(['id' => getNextId($data['ledgerEntries'])], $input);
            $data['ledgerEntries'][] = $newItem;
            saveData($data);
            echo json_encode($newItem);
        } elseif ($method === 'PUT' && $id) {
            foreach ($data['ledgerEntries'] as &$l) {
                if ($l['id'] == $id) {
                    $l = array_merge($l, $input);
                    break;
                }
            }
            saveData($data);
            echo json_encode(['success' => true]);
        } elseif ($method === 'DELETE' && $id) {
            $data['ledgerEntries'] = array_values(array_filter($data['ledgerEntries'], fn($l) => $l['id'] != $id));
            saveData($data);
            echo json_encode(['success' => true]);
        }
        break;

    case 'backup':
        echo json_encode($data);
        break;

    case 'restore':
        if ($method === 'POST') {
            saveData($input);
            echo json_encode(['success' => true]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}
?>
