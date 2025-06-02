<?php
// Simple test to check Turso connection
$tursoUrl = getenv('TURSO_DATABASE_URL');
$tursoToken = getenv('TURSO_AUTH_TOKEN');

echo "Testing Turso connection...\n";
echo "URL: " . $tursoUrl . "\n";
echo "Token present: " . ($tursoToken ? "Yes" : "No") . "\n";

// Convert URL for HTTP API
if (strpos($tursoUrl, 'libsql://') === 0) {
    $httpUrl = str_replace('libsql://', 'https://', $tursoUrl) . '/v2/pipeline';
} else {
    $httpUrl = rtrim($tursoUrl, '/') . '/v2/pipeline';
}

echo "HTTP URL: " . $httpUrl . "\n";

// Test simple query
$data = json_encode([
    'requests' => [
        [
            'type' => 'execute',
            'stmt' => [
                'sql' => 'SELECT 1 as test'
            ]
        ]
    ]
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $httpUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $tursoToken,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: " . $httpCode . "\n";
echo "Error: " . $error . "\n";
echo "Response: " . $response . "\n";
?>