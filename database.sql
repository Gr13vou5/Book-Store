CREATE DATABASE IF NOT EXISTS online_book_store;
USE online_book_store;

CREATE TABLE IF NOT EXISTS Categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoryId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,1) DEFAULT 0,
  image VARCHAR(512),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES Categories(id)
);

CREATE TABLE IF NOT EXISTS Locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  mapsUrl VARCHAR(512) NOT NULL
);

CREATE TABLE IF NOT EXISTS ProductLocations (
  productId INT NOT NULL,
  locationId INT NOT NULL,
  stock INT DEFAULT 0,
  PRIMARY KEY (productId, locationId),
  FOREIGN KEY (productId) REFERENCES Products(id),
  FOREIGN KEY (locationId) REFERENCES Locations(id)
);

-- Seed Data
INSERT IGNORE INTO Users (id, email, password, name, role) VALUES
(1, 'admin@admin.com', '$2y$10$tZ31vS6yqWzJ0NlMhQc.OO60rQWp0/8GZ5C5iW.LgS0S/NfI6X./S', 'Admin', 'admin');

INSERT IGNORE INTO Categories (id, name) VALUES 
(1, 'Fiction'),
(2, 'Non-Fiction'),
(3, 'Science Fiction'),
(4, 'Programming');

INSERT IGNORE INTO Locations (id, name, address, mapsUrl) VALUES 
(1, 'Central Bookstore', '123 Main St, Cityville', 'https://maps.app.goo.gl/3wDua9BNEZMrFcfp6'),
(2, 'Nhà sách ASAVA BOOK', '456 North Ave, Uptown', 'https://maps.app.goo.gl/m8VE5WNZvpzJCaPh6');

INSERT IGNORE INTO Products (id, categoryId, title, author, description, price, rating, image) VALUES 
(1, 4, 'The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 'Your journey to mastery.', 39.99, 4.8, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
(2, 4, 'Clean Code', 'Robert C. Martin', 'A Handbook of Agile Software Craftsmanship.', 45.00, 4.7, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'),
(3, 3, 'Dune', 'Frank Herbert', 'A masterpiece of science fiction.', 15.99, 4.9, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'),
(4, 1, 'The Great Gatsby', 'F. Scott Fitzgerald', 'A true classic of twentieth-century literature.', 10.99, 4.3, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
(5, 1, 'To Kill a Mockingbird', 'Harper Lee', 'A gripping, heart-wrenching, and wholly remarkable tale.', 14.99, 4.8, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'),
(6, 1, '1984', 'George Orwell', 'Among the seminal texts of the 20th century.', 12.99, 4.7, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'),
(7, 1, 'Pride and Prejudice', 'Jane Austen', 'An unforgettable piece of romantic fiction.', 9.99, 4.6, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
(8, 1, 'The Catcher in the Rye', 'J.D. Salinger', 'The hero-narrator of The Catcher in the Rye is an ancient child of sixteen.', 11.50, 4.2, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'),
(9, 2, 'Sapiens', 'Yuval Noah Harari', 'A Brief History of Humankind.', 22.00, 4.8, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'),
(10, 2, 'Thinking, Fast and Slow', 'Daniel Kahneman', 'The phenomenal New York Times Bestseller.', 19.99, 4.6, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
(11, 2, 'Atomic Habits', 'James Clear', 'No matter your goals, Atomic Habits offers a proven framework for improving.', 18.00, 4.9, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'),
(12, 2, 'Educated', 'Tara Westover', 'An unforgettable memoir about a young girl.', 16.50, 4.7, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'),
(13, 2, 'Becoming', 'Michelle Obama', 'An intimate, powerful, and inspiring memoir.', 21.00, 4.8, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
(14, 3, 'Neuromancer', 'William Gibson', 'Before the Matrix, before Star Wars, before Ender.', 14.50, 4.5, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'),
(15, 3, 'Foundation', 'Isaac Asimov', 'The first novel in Isaac Asimovs classic science-fiction masterpiece.', 13.99, 4.6, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'),
(16, 3, 'Snow Crash', 'Neal Stephenson', 'A mind-altering romp through a future America.', 15.00, 4.4, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
(17, 3, 'The Martian', 'Andy Weir', 'Nominated as one of Americas best-loved novels.', 16.00, 4.8, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'),
(18, 3, 'Enders Game', 'Orson Scott Card', 'The classic of modern science fiction.', 12.50, 4.7, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'),
(19, 4, 'Design Patterns', 'Erich Gamma', 'Elements of Reusable Object-Oriented Software.', 55.00, 4.6, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
(20, 4, 'Introduction to Algorithms', 'Thomas H. Cormen', 'Some books on algorithms are rigorous but incomplete.', 85.00, 4.7, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400'),
(21, 4, 'You Dont Know JS', 'Kyle Simpson', 'Up & Going.', 25.00, 4.8, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'),
(22, 4, 'Refactoring', 'Martin Fowler', 'Improving the Design of Existing Code.', 48.00, 4.7, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400'),
(23, 4, 'Eloquent JavaScript', 'Marijn Haverbeke', 'A Modern Introduction to Programming.', 35.00, 4.6, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400');

INSERT IGNORE INTO ProductLocations (productId, locationId, stock) VALUES 
(1, 1, 10), (1, 2, 5), (2, 1, 20), (3, 2, 15),
(4, 1, 8), (4, 2, 12), (5, 1, 5), (6, 2, 20),
(7, 1, 3), (7, 2, 14), (8, 1, 10), (9, 2, 7),
(10, 1, 15), (11, 1, 20), (11, 2, 15), (12, 1, 6),
(13, 2, 25), (14, 1, 9), (15, 2, 18), (16, 1, 4),
(17, 1, 12), (17, 2, 12), (18, 1, 30), (19, 2, 5),
(20, 1, 2), (21, 1, 40), (22, 2, 8), (23, 1, 22), (23, 2, 11);
