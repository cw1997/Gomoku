/*
Navicat MySQL Data Transfer

Source Server         : 昌维
Source Server Version : 50553
Source Host           : localhost:3306
Source Database       : gobang

Target Server Type    : MYSQL
Target Server Version : 50553
File Encoding         : 65001

Date: 2017-02-13 19:00:03
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for gobang_records
-- ----------------------------
DROP TABLE IF EXISTS `gobang_records`;
CREATE TABLE `gobang_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int(10) unsigned DEFAULT NULL,
  `x` varchar(3) DEFAULT NULL,
  `y` tinyint(3) unsigned DEFAULT NULL,
  `isblack` tinyint(3) unsigned DEFAULT NULL COMMENT '黑方为1，白方为0',
  `uid` int(10) unsigned DEFAULT NULL,
  `index` smallint(5) unsigned DEFAULT NULL COMMENT '步进',
  `record_time` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MEMORY DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for gobang_rooms
-- ----------------------------
DROP TABLE IF EXISTS `gobang_rooms`;
CREATE TABLE `gobang_rooms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `black_uid` int(10) unsigned DEFAULT NULL,
  `black_seconds` mediumint(5) unsigned DEFAULT NULL COMMENT '黑方读秒',
  `white_uid` int(10) unsigned DEFAULT NULL,
  `white_seconds` mediumint(5) unsigned DEFAULT NULL,
  `last_player` tinyint(3) unsigned DEFAULT NULL COMMENT '黑方先手，但是此处记录是最后行棋者，因此此处默认为2，枚举值：黑方为1，白方为2',
  `create_time` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MEMORY DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for gobang_users
-- ----------------------------
DROP TABLE IF EXISTS `gobang_users`;
CREATE TABLE `gobang_users` (
  `id` int(10) unsigned NOT NULL,
  `status` tinyint(3) unsigned DEFAULT NULL COMMENT '0表示空闲，1表示黑方，2表示白方，3接受挑战，4拒绝挑战',
  `remote_addr` varchar(255) DEFAULT NULL,
  `remote_port` varchar(255) DEFAULT NULL,
  `request_time` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MEMORY DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for gobang_users_log
-- ----------------------------
DROP TABLE IF EXISTS `gobang_users_log`;
CREATE TABLE `gobang_users_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `remote_addr` varchar(255) DEFAULT NULL,
  `remote_port` varchar(255) DEFAULT NULL,
  `request_time` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
DROP TRIGGER IF EXISTS `login`;
DELIMITER ;;
CREATE TRIGGER `login` AFTER INSERT ON `gobang_users` FOR EACH ROW BEGIN
     insert into gobang_users_log(remote_addr,remote_port,request_time) values(new.remote_addr,new.remote_port,new.request_time);
END
;;
DELIMITER ;
