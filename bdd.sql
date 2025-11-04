-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: panaderia_esperanza
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Panes Tradicionales','Panes clasicos mexicanos y franceses'),(2,'Panes Dulces','Conchas, donas y panes con cobertura'),(3,'Hojaldre','Productos con masa laminada'),(4,'Pasteles','Pasteles y postres especiales'),(5,'Especiales Navidad','Productos especiales de temporada navideña');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iconos_productos`
--

DROP TABLE IF EXISTS `iconos_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iconos_productos` (
  `id_icono` int NOT NULL AUTO_INCREMENT,
  `id_producto` int DEFAULT NULL,
  `icono` varchar(10) NOT NULL,
  PRIMARY KEY (`id_icono`),
  UNIQUE KEY `id_producto` (`id_producto`),
  CONSTRAINT `iconos_productos_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iconos_productos`
--

LOCK TABLES `iconos_productos` WRITE;
/*!40000 ALTER TABLE `iconos_productos` DISABLE KEYS */;
INSERT INTO `iconos_productos` VALUES (1,1,'?'),(2,2,'?'),(3,3,'?'),(4,4,'?'),(5,5,'?'),(6,6,'?'),(7,7,'?'),(8,8,'?'),(9,9,'?'),(10,10,'?'),(11,11,'?'),(12,12,'?'),(13,13,'?'),(14,14,'?'),(15,15,'?'),(16,16,'?'),(17,17,'?'),(18,18,'?'),(19,19,'??'),(20,NULL,'?'),(21,NULL,'?'),(22,NULL,'?'),(23,NULL,'?'),(24,NULL,'?'),(25,NULL,'?'),(26,20,'?'),(27,21,'?'),(28,22,'?');
/*!40000 ALTER TABLE `iconos_productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `id_categoria` int DEFAULT NULL,
  `imagen_url` varchar(500) DEFAULT NULL,
  `stock` int DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `es_especial` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_producto`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Sauerdouu','Pan fermentado totalmente con masa madre. Horneado en horno de piedra, más digerible.',45.00,1,'https://corporativo.esperanza.mx/filemanager/acf6cd7a-e5f0-4f3c-ba4d-916a0c9163eb.jpg',50,1,'2025-11-01 23:35:01',0),(2,'Bolillo','Pan tradicional salado de forma característica. Crujiente por fuera, blando por dentro.',35.00,1,'https://corporativo.esperanza.mx/filemanager/8c036952-15bf-4319-97ae-2a0aaa25e964.jpg',100,1,'2025-11-01 23:35:01',0),(3,'Bollos rellenos de queso','Bollo característico cubierto con ajonjolí, relleno de queso crema.',65.00,1,'https://corporativo.esperanza.mx/filemanager/9aa556bb-e1a0-46d8-b267-306d1c2a24b4.jpg',40,1,'2025-11-01 23:35:01',0),(4,'Cascara de mantequilla','Mitad de baguette cubierta con mantequilla y espolvoreadas de azúcar.',40.00,2,'https://corporativo.esperanza.mx/filemanager/9827e608-ac48-4b13-bf7c-7576b611eb36.jpg',60,1,'2025-11-01 23:35:01',0),(5,'Muffin de queso','Muffin tradicional de queso.',18.00,2,'https://corporativo.esperanza.mx/filemanager/255c2fe1-b7e1-4b4b-96b8-59498bb7a6d0.jpg',80,1,'2025-11-01 23:35:01',0),(6,'Multi','Panqué a base de mantequilla con corteza de chocolate.',25.00,2,'https://corporativo.esperanza.mx/filemanager/dae301cb-160b-4c66-a7c2-6fdeb3c28355.jpg',70,1,'2025-11-01 23:35:01',0),(7,'Concha vainilla','Pan hecho a base de bizcocho redondo, cubierto con pasta con un sello tipo concha.',22.00,2,'https://corporativo.esperanza.mx/filemanager/9d548bfb-9fc0-4e1e-959c-dab756f43b1e.jpg',90,1,'2025-11-01 23:35:01',0),(8,'Dona Chocolate','Masa tradicional de dona con cobertura de chocolate.',55.00,2,'https://corporativo.esperanza.mx/filemanager/8a89f924-d0ad-48c6-8de5-e962a5d90754.jpg',45,1,'2025-11-01 23:35:01',0),(9,'Crujiente de pistache','Masa laminada rellena con una mezcla de kataifi horneado y crema de pistache',38.00,3,'https://corporativo.esperanza.mx/filemanager/32b6474e-10f4-4861-8d10-8b27487784c1.jpg',30,1,'2025-11-01 23:35:01',0),(10,'Chocolatin','Pan de masa hojaldrada con relleno de chocolate semi amargo.',42.00,3,'https://corporativo.esperanza.mx/filemanager/5c5b80c8-5ed0-4228-924d-bd70a032ba59.jpg',55,1,'2025-11-01 23:35:01',0),(11,'Croissant','Pan de masa hojaldrada, fermentada a base de mantequilla.',30.00,3,'https://corporativo.esperanza.mx/filemanager/54eb6ea7-67de-4f92-a426-1bb7663dfcb1.jpg',75,1,'2025-11-01 23:35:01',0),(12,'Amann','Pan laminado de masa muy fina de mantequilla y azúcar.',35.00,3,'https://corporativo.esperanza.mx/filemanager/6b0d0f8f-93d3-43b1-9f74-434b34249048.jpg',50,1,'2025-11-01 23:35:01',0),(13,'Crepecake Hennessy','Crepas de chocolate, ganache de chocolate. Con un toque de coñac.',450.00,4,'https://corporativo.esperanza.mx/filemanager/0d3d853f-9495-447c-a500-d0aa57411e6c.jpg',10,1,'2025-11-01 23:35:01',0),(14,'Supremo de chocolate','Pastel hecho a base de panqué de chocolate con relleno y decorado de ganache de chocolate.',120.00,4,'https://corporativo.esperanza.mx/filemanager/0b3f8832-843a-435a-ad9c-f297734fd9f9.jpg',20,1,'2025-11-01 23:35:01',0),(15,'Supremo de coco','Pastel hecho a base de panqué sabor a coco, relleno y decorado con crema sabor a coco. Cubierto con hojuelas de coco.',28.00,4,'https://corporativo.esperanza.mx/filemanager/82cfbbca-17ba-46dd-9dcf-cff141d29d27.jpg',25,1,'2025-11-01 23:35:01',0),(16,'Red velvet','Pan de chocolate rojo tipo americano con chispas de chocolate. Relleno y cubierto con crema de queso.',85.00,4,'https://corporativo.esperanza.mx/filemanager/dcc15a2a-15e7-42b8-802f-d6a0f1c889bb.jpg',15,1,'2025-11-01 23:35:01',0),(17,'Pan de Muerto','Pan tradicional de la temporada de Día de Muertos, decorado con huesitos de azúcar y aroma de azahar. Una delicia que honra nuestras tradiciones.',45.00,1,'https://corporativo.esperanza.mx/filemanager/4a018823-0669-42ff-aad7-9d728e8b8be2.jpg',50,1,'2025-11-02 03:09:13',1),(18,'Dona Jack Calabaza','Dona especial de Halloween decorada como calabaza de Jack-O-Lantern. Glaseado naranja con detalles espeluznantes que te harán gritar de alegría.',35.00,2,'https://corporativo.esperanza.mx/filemanager/0e693119-0f76-4b8d-b060-3e91092edb0b.jpg',30,1,'2025-11-02 03:09:13',1),(19,'Dona Telaraña','Dona glaseada con decoración de telaraña perfecta para Halloween. Chocolate oscuro con hilos de caramelo blanco formando una telaraña escalofriante.',35.00,2,'https://corporativo.esperanza.mx/filemanager/09ef37d6-cb62-46cc-8d3f-cbb870781517.jpg',25,1,'2025-11-02 03:09:13',1),(20,'Panetone','Pan dulce esponjoso de origen italiano con frutas confitadas y pasas. Perfecto para compartir en estas fiestas.',85.00,1,'https://media.istockphoto.com/id/483677483/es/foto/panettone-italiana-tarta-de-navidad.jpg?s=612x612&w=0&k=20&c=FB9Mmr_Ctc_ZNXSNzc81Gih4TjWj3UDdouqxCxIyyXo=',40,1,'2025-11-03 03:38:10',1),(21,'Buñuelos','Masa frita crujiente cubierta con azúcar o miel de piloncillo. Tradición mexicana infaltable en Navidad.',35.00,1,'https://media.istockphoto.com/id/1216699137/es/foto/bu%C3%B1uelos-mexicanos-plato-dulce-hecho-de-masa-de-harina-frita-c.jpg?s=612x612&w=0&k=20&c=5p-23wL-B-GWXMZvJ1aaCZrxdnkI73X3w-9oNFcv4_w=',60,1,'2025-11-03 03:38:10',1),(22,'Rosca de Reyes','Pan en forma de aro decorado con frutas cristalizadas que se come el 6 de enero. ¿Encontrarás el muñequito?',95.00,1,'http://st3.depositphotos.com/3283693/13141/i/450/depositphotos_131415040-stock-photo-rosaca-de-reyes.jpg',35,1,'2025-11-03 03:38:10',1);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-03 13:02:18
