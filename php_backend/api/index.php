<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/db.php';

// Parse URL
$requestPath = isset($_GET['request']) ? trim($_GET['request'], '/') : '';
$method = $_SERVER['REQUEST_METHOD'];

function checkAdmin($pdo) {
    $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
    $auth = $headers['Authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if (!$auth && isset($_GET['token'])) { $auth = 'Bearer ' . $_GET['token']; }
    if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
        $tokenData = json_decode(base64_decode($matches[1]), true);
        if ($tokenData && isset($tokenData['id'])) {
            $stmt = $pdo->prepare('SELECT role FROM Users WHERE id = ?');
            $stmt->execute([$tokenData['id']]);
            $user = $stmt->fetch();
            if ($user && $user['role'] === 'admin') {
                return true;
            }
        }
    }
    return false;
}

// Admin Route: /api/locations (POST/PUT/DELETE)
if (preg_match('/^locations\/?([0-9]+)?$/', $requestPath, $matches) && in_array($method, ['POST', 'PUT', 'DELETE'])) {
    if (!checkAdmin($pdo)) {
        http_response_code(403);
        echo json_encode(["error" => "Forbidden"]);
        exit;
    }
    
    $id = isset($matches[1]) ? $matches[1] : null;
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    
    if ($method === 'POST') {
        $stmt = $pdo->prepare('INSERT INTO Locations (name, address, mapsUrl) VALUES (?, ?, ?)');
        $stmt->execute([$data['name'], $data['address'], $data['mapsUrl']]);
        echo json_encode(["id" => $pdo->lastInsertId()]);
    } else if ($method === 'PUT' && $id) {
        $stmt = $pdo->prepare('UPDATE Locations SET name = ?, address = ?, mapsUrl = ? WHERE id = ?');
        $stmt->execute([$data['name'], $data['address'], $data['mapsUrl'], $id]);
        echo json_encode(["success" => true]);
    } else if ($method === 'DELETE' && $id) {
        $pdo->prepare('DELETE FROM ProductLocations WHERE locationId = ?')->execute([$id]);
        $pdo->prepare('DELETE FROM Locations WHERE id = ?')->execute([$id]);
        echo json_encode(["success" => true]);
    }
    exit;
}

if ($requestPath === 'locations' && $method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM Locations');
    echo json_encode($stmt->fetchAll());
    exit;
}

// Admin Route: /api/products (POST/PUT/DELETE)
if (preg_match('/^products\/?([0-9]+)?$/', $requestPath, $matches) && in_array($method, ['POST', 'PUT', 'DELETE'])) {
    if (!checkAdmin($pdo)) {
        http_response_code(403);
        echo json_encode(["error" => "Forbidden"]);
        exit;
    }

    $id = isset($matches[1]) ? $matches[1] : null;
    $data = json_decode(file_get_contents('php://input'), true);

    if ($method === 'POST') {
        $stmt = $pdo->prepare('INSERT INTO Products (categoryId, title, author, description, price, image) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$data['categoryId'], $data['title'], $data['author'], $data['description'], $data['price'], $data['image'] ?? '']);
        
        $newId = $pdo->lastInsertId();
        
        if (isset($data['locations']) && is_array($data['locations'])) {
            $locStmt = $pdo->prepare('INSERT INTO ProductLocations (productId, locationId, stock) VALUES (?, ?, ?)');
            foreach ($data['locations'] as $loc) {
                $locStmt->execute([$newId, $loc['locationId'], $loc['stock']]);
            }
        }
        echo json_encode(["id" => $newId]);
        exit;
    }

    if ($method === 'PUT' && $id) {
        $stmt = $pdo->prepare('UPDATE Products SET categoryId = ?, title = ?, author = ?, description = ?, price = ?, image = ? WHERE id = ?');
        $stmt->execute([$data['categoryId'], $data['title'], $data['author'], $data['description'], $data['price'], $data['image'] ?? '', $id]);
        
        if (isset($data['locations']) && is_array($data['locations'])) {
            $pdo->prepare('DELETE FROM ProductLocations WHERE productId = ?')->execute([$id]);
            $locStmt = $pdo->prepare('INSERT INTO ProductLocations (productId, locationId, stock) VALUES (?, ?, ?)');
            foreach ($data['locations'] as $loc) {
                $locStmt->execute([$id, $loc['locationId'], $loc['stock']]);
            }
        }
        echo json_encode(["success" => true]);
        exit;
    }
    
    if ($method === 'DELETE' && $id) {
        $pdo->prepare('DELETE FROM ProductLocations WHERE productId = ?')->execute([$id]);
        $pdo->prepare('DELETE FROM Products WHERE id = ?')->execute([$id]);
        echo json_encode(["success" => true]);
        exit;
    }
}

// Route: /api/categories
if ($requestPath === 'categories' && $method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM Categories');
    echo json_encode($stmt->fetchAll());
    exit;
}

// Route: /api/products (List & Details)
if (preg_match('/^products\/?([0-9]+)?$/', $requestPath, $matches) && $method === 'GET') {
    if (isset($matches[1]) && $matches[1] !== '') {
        // Get single product
        $id = $matches[1];
        
        $stmt = $pdo->prepare('SELECT Products.*, Categories.name as categoryName FROM Products JOIN Categories ON Products.categoryId = Categories.id WHERE Products.id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        
        if (!$product) {
            http_response_code(404);
            echo json_encode(["error" => "Product not found"]);
            exit;
        }
        
        $locStmt = $pdo->prepare('SELECT Locations.id, Locations.name, Locations.address, Locations.mapsUrl, ProductLocations.stock FROM Locations JOIN ProductLocations ON Locations.id = ProductLocations.locationId WHERE ProductLocations.productId = ? AND ProductLocations.stock > 0');
        $locStmt->execute([$id]);
        $locations = $locStmt->fetchAll();
        
        echo json_encode(["product" => $product, "locations" => $locations]);
        exit;
    } else {
        // List products
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? '';
        $sort = $_GET['sort'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 10);
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT Products.*, Categories.name as categoryName FROM Products JOIN Categories ON Products.categoryId = Categories.id WHERE 1=1";
        $params = [];
        
        if ($search) {
            $query .= " AND (title LIKE ? OR author LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if ($category) {
            $query .= " AND categoryId = ?";
            $params[] = $category;
        }
        
        $sortOptions = [
            "price_asc" => "price ASC",
            "price_desc" => "price DESC",
            "name_asc" => "title ASC",
            "name_desc" => "title DESC",
            "rating_desc" => "rating DESC"
        ];
        
        if ($sort && isset($sortOptions[$sort])) {
            $query .= " ORDER BY " . $sortOptions[$sort];
        } else {
            $query .= " ORDER BY Products.id DESC";
        }
        
        // Count query
        $countQuery = "SELECT COUNT(*) as total FROM ($query) as total_query";
        $stmtCount = $pdo->prepare($countQuery);
        $stmtCount->execute($params);
        $totalResult = $stmtCount->fetch();
        $total = $totalResult['total'];
        
        // Add Pagination
        $query .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $products = $stmt->fetchAll();
        
        echo json_encode([
            "products" => $products,
            "pagination" => [
                "total" => $total,
                "page" => $page,
                "limit" => $limit,
                "totalPages" => ceil($total / $limit)
            ]
        ]);
        exit;
    }
}

// Minimal Auth Implementation (for login/register routing)
// Note: Requires simple base64 mechanism because we can't use node's JWT library in default PHP
if (preg_match('/^auth\/(.*)$/', $requestPath, $matches) && $method === 'POST') {
    $action = trim($matches[1], '/');
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'login') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        $stmt = $pdo->prepare('SELECT * FROM Users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Very simple token for demonstration
            $token = base64_encode(json_encode(["id" => $user['id'], "email" => $user['email']]));
            echo json_encode([
                "token" => $token,
                "user" => ["id" => $user['id'], "email" => $user['email'], "name" => $user['name'], "role" => $user['role']]
            ]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid credentials"]);
        }
        exit;
    }
    
    if ($action === 'register') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $name = $data['name'] ?? '';
        
        $stmt = $pdo->prepare('SELECT id FROM Users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Email already registered"]);
            exit;
        }
        
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO Users (email, password, name) VALUES (?, ?, ?)');
        $stmt->execute([$email, $hashed, $name]);
        
        $id = $pdo->lastInsertId();
        $token = base64_encode(json_encode(["id" => $id, "email" => $email]));
        
        echo json_encode([
            "token" => $token,
            "user" => ["id" => $id, "email" => $email, "name" => $name, "role" => "user"]
        ]);
        exit;
    }

    if ($action === 'forgot-password') {
        $email = $data['email'] ?? '';
        if (!$email) {
            http_response_code(400);
            echo json_encode(["error" => "Email is required"]);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id, email FROM Users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(["error" => "Email address not found in our records."]);
            exit;
        }

        $token = bin2hex(random_bytes(32));

            // Create table if it doesn't exist for simplicity, or just assume it exists
            $pdo->exec("CREATE TABLE IF NOT EXISTS PasswordResets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expiresAt DATETIME NOT NULL
            )");
            
            $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour
            $stmt = $pdo->prepare('INSERT INTO PasswordResets (email, token, expiresAt) VALUES (?, ?, ?)');
            $stmt->execute([$email, $token, $expiresAt]);

            // Using SMTP Socket to send email without needing XAMPP sendmail configuration
            $resetLink = "http://localhost:5173/reset-password?token=" . $token; // Default vite port
            if (isset($_SERVER['HTTP_ORIGIN'])) {
                $resetLink = $_SERVER['HTTP_ORIGIN'] . "/reset-password?token=" . $token;
            }
            
            $smtpHost = getenv('MAILTRAP_HOST') ?: 'sandbox.smtp.mailtrap.io';
            $smtpPort = getenv('MAILTRAP_PORT') ?: 2525;
            $smtpUser = getenv('MAILTRAP_USER') ?: 'YOUR_MAILTRAP_USER';
            $smtpPass = getenv('MAILTRAP_PASS') ?: 'YOUR_MAILTRAP_PASS';

            $envPath = __DIR__ . '/../../.env';
            if (file_exists($envPath)) {
                $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    if (strpos(trim($line), '#') === 0) continue;
                    $parts = explode('=', $line, 2);
                    if (count($parts) === 2) {
                        $name = trim($parts[0]);
                        $value = trim(trim($parts[1]), "\"'");
                        if ($name === 'MAILTRAP_HOST') $smtpHost = $value;
                        if ($name === 'MAILTRAP_PORT') $smtpPort = $value;
                        if ($name === 'MAILTRAP_USER') $smtpUser = $value;
                        if ($name === 'MAILTRAP_PASS') $smtpPass = $value;
                    }
                }
            }

            try {
                $smtpLog = [];
                $smtpLog[] = "Loaded User: " . substr($smtpUser, 0, 4) . "***";
                
                $socket = @fsockopen($smtpHost, $smtpPort, $errno, $errstr, 5);
                if ($socket) {
                    stream_set_timeout($socket, 5);
                    $readResponse = function($s) use (&$smtpLog) {
                        $str = "";
                        while ($line = fgets($s, 515)) {
                            $str .= $line;
                            if (substr($line, 3, 1) == " ") break;
                        }
                        $smtpLog[] = "S: " . trim($str);
                        return $str;
                    };
                    $readResponse($socket);
                    
                    $smtpLog[] = "C: EHLO localhost";
                    fwrite($socket, "EHLO localhost\r\n");
                    $readResponse($socket);
                    
                    $smtpLog[] = "C: AUTH LOGIN";
                    fwrite($socket, "AUTH LOGIN\r\n");
                    $readResponse($socket);
                    
                    $smtpLog[] = "C: [USER_BASE64]";
                    fwrite($socket, base64_encode($smtpUser) . "\r\n");
                    $readResponse($socket);
                    
                    $smtpLog[] = "C: [PASS_BASE64]";
                    fwrite($socket, base64_encode($smtpPass) . "\r\n");
                    $readResponse($socket);
                    
                    $fromEmail = "noreply@chapters.com";
                    $smtpLog[] = "C: MAIL FROM: <$fromEmail>";
                    fwrite($socket, "MAIL FROM: <$fromEmail>\r\n");
                    $readResponse($socket);
                    
                    $smtpLog[] = "C: RCPT TO: <$email>";
                    fwrite($socket, "RCPT TO: <$email>\r\n");
                    $readResponse($socket);
                    
                    $smtpLog[] = "C: DATA";
                    fwrite($socket, "DATA\r\n");
                    $readResponse($socket);
                    
                    $emailHeaders = "From: Chapters Bookstore <$fromEmail>\r\n";
                    $emailHeaders .= "To: <$email>\r\n";
                    $emailHeaders .= "Subject: Password Reset Request\r\n";
                    $emailHeaders .= "Content-Type: text/html; charset=UTF-8\r\n";
                    
                    $emailBody = "<p>You requested a password reset. Click below to reset your password:</p><p><a href=\"$resetLink\">$resetLink</a></p>";
                    
                    $smtpLog[] = "C: [EMAIL CONTENT AND .]";
                    fwrite($socket, $emailHeaders . "\r\n" . $emailBody . "\r\n.\r\n");
                    $readResponse($socket);
                    
                    $smtpLog[] = "C: QUIT";
                    fwrite($socket, "QUIT\r\n");
                    fclose($socket);
                } else {
                    $smtpLog[] = "Error: Could not connect to $smtpHost:$smtpPort - $errstr ($errno)";
                }
            } catch (Exception $e) {
                error_log("SMTP Error: " . $e->getMessage());
                $smtpLog[] = "Exception: " . $e->getMessage();
            }

        echo json_encode([
            "message" => "A password reset link has been sent to your email.",
            "debug_smtp" => $smtpLog ?? []
        ]);
        exit;
    }

    if ($action === 'reset-password') {
        $token = $data['token'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        if (!$token || !$newPassword) {
            http_response_code(400);
            echo json_encode(["error" => "Token and new password are required"]);
            exit;
        }

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare('SELECT * FROM PasswordResets WHERE token = ? AND expiresAt > ?');
        $stmt->execute([$token, $now]);
        $resetRecord = $stmt->fetch();

        if (!$resetRecord) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid or expired reset token"]);
            exit;
        }

        $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('UPDATE Users SET password = ? WHERE email = ?');
        $stmt->execute([$hashed, $resetRecord['email']]);

        $stmt = $pdo->prepare('DELETE FROM PasswordResets WHERE email = ?');
        $stmt->execute([$resetRecord['email']]);

        echo json_encode(["message" => "Password reset successful"]);
        exit;
    }
}

// Fallback Route for `/api/auth/me`
if ($requestPath === 'auth/me' && $method === 'GET') {
    // Check apache_request_headers (fallback to getallheaders depending on server setup)
    $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
    $auth = $headers['Authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if (!$auth && isset($_GET['token'])) { $auth = 'Bearer ' . $_GET['token']; }
    
    if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
        $tokenData = json_decode(base64_decode($matches[1]), true);
        if ($tokenData && isset($tokenData['id'])) {
            $stmt = $pdo->prepare('SELECT id, email, name, role FROM Users WHERE id = ?');
            $stmt->execute([$tokenData['id']]);
            $user = $stmt->fetch();
            if ($user) {
                echo json_encode(["user" => $user]);
                exit;
            }
        }
    }
    http_response_code(401);
    echo json_encode(["error" => "Invalid token"]);
    exit;
}

http_response_code(404);
echo json_encode(["error" => "Route not found"]);
?>
