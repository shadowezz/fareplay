CREATE TABLE Session (
	id INTEGER PRIMARY KEY AUTO_INCREMENT,
	sessionString TEXT,
	nonce TEXT,
	state TEXT,
	accessToken TEXT,
	codeVerifier TEXT,
	sub TEXT
);