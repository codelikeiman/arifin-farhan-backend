-- 1. Buat tabel exam_questions dulu
CREATE TABLE `exam_questions` (
`id` INT NOT NULL AUTO_INCREMENT,
`exam_id` INT NOT NULL,
`question_id` INT NOT NULL,
`order` INT NULL,
PRIMARY KEY (`id`),
UNIQUE INDEX `exam_questions_exam_id_question_id_key`(`exam_id`, `question_id`)
);

-- 2. Tambah kolom baru ke questions (nullable dulu, supaya data lama tidak error)
ALTER TABLE `questions`
ADD COLUMN `subject_id` INT NULL,
ADD COLUMN `difficulty` ENUM('MUDAH','SEDANG','SULIT') NOT NULL DEFAULT 'SEDANG',
ADD COLUMN `created_by` INT NULL,
ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- 3. Backfill: pindahkan relasi exam_id lama -> exam_questions
INSERT INTO `exam_questions` (`exam_id`, `question_id`)
SELECT `exam_id`, `id` FROM `questions`;

-- 4. Backfill: isi subject_id soal berdasarkan mata pelajaran ujian asalnya
UPDATE `questions` q
JOIN `exams` e ON q.exam_id = e.id
SET q.subject_id = e.subject_id;

-- 5. Sekarang subject_id sudah terisi semua, jadikan NOT NULL
ALTER TABLE `questions` MODIFY `subject_id` INT NOT NULL;

-- 6. Hapus kolom exam_id lama dari questions (relasi lama sudah dipindah ke exam_questions)
ALTER TABLE `questions` DROP FOREIGN KEY `questions_exam_id_fkey`;
ALTER TABLE `questions` DROP COLUMN `exam_id`;

-- 7. Tambah foreign key baru
ALTER TABLE `questions`
ADD CONSTRAINT `questions_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`),
ADD CONSTRAINT `questions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`);

ALTER TABLE `exam_questions`
ADD CONSTRAINT `exam_questions_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`),
ADD CONSTRAINT `exam_questions_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`);