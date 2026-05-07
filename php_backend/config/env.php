<?php
function loadEnv() {
    $envPaths = [
        __DIR__ . '/../../.env',       
        __DIR__ . '/../../../.env',       
        __DIR__ . '/../../../../.env',    
        ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env' 
    ];
    
    foreach ($envPaths as $envPath) {
        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $name = trim($parts[0]);
                    $value = trim(trim($parts[1]), "\"'");
                    putenv("$name=$value");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
            return true;
        }
    }
    return false;
}

loadEnv();
?>
