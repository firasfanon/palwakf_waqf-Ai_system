import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, int, mysqlEnum, varchar, text, timestamp, decimal, tinyint, uniqueIndex } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const attachments = mysqlTable("attachments", {
	id: int().autoincrement().notNull(),
	entityType: mysqlEnum(['property','case','ruling','deed','instruction']).notNull(),
	entityId: int().notNull(),
	fileName: varchar({ length: 500 }).notNull(),
	fileUrl: varchar({ length: 1000 }).notNull(),
	fileType: varchar({ length: 100 }).notNull(),
	fileSize: int().notNull(),
	description: text(),
	uploadedBy: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("entity_idx").on(table.entityType, table.entityId),
	index("uploaded_by_idx").on(table.uploadedBy),
]);

export const bookmarks = mysqlTable("bookmarks", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	documentId: int().notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" } ),
	collectionName: varchar({ length: 200 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("user_idx").on(table.userId),
	index("document_idx").on(table.documentId),
	index("unique_bookmark").on(table.userId, table.documentId),
]);

export const cachedResponses = mysqlTable("cached_responses", {
	id: int().autoincrement().notNull(),
	questionNormalized: varchar("question_normalized", { length: 1000 }).notNull(),
	questionOriginal: text("question_original").notNull(),
	answer: text().notNull(),
	sources: text(),
	category: mysqlEnum(['general','legal','jurisprudence','administrative','historical']).default('general').notNull(),
	hitCount: int("hit_count").default(0).notNull(),
	rating: decimal({ precision: 3, scale: 2 }),
	ratingCount: int("rating_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
},
(table) => [
	index("cached_responses_question_normalized_unique").on(table.questionNormalized),
	index("question_idx").on(table.questionNormalized),
	index("category_idx").on(table.category),
	index("hit_count_idx").on(table.hitCount),
	index("last_used_idx").on(table.lastUsedAt),
]);

export const classificationRatings = mysqlTable("classification_ratings", {
	id: int().autoincrement().notNull(),
	fetchedContentId: int("fetched_content_id").notNull().references(() => fetchedContent.id, { onDelete: "cascade" } ),
	rating: mysqlEnum(['positive','negative']).notNull(),
	feedback: text(),
	ratedBy: int("rated_by").references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("fetched_content_idx").on(table.fetchedContentId),
	index("rating_idx").on(table.rating),
	index("rated_by_idx").on(table.ratedBy),
]);


export const fetchedContentReviewEvents = mysqlTable("fetched_content_review_events", {
	id: int().autoincrement().notNull(),
	fetchedContentId: int("fetched_content_id").notNull().references(() => fetchedContent.id, { onDelete: "cascade" } ),
	eventType: mysqlEnum("event_type", ['route','extraction','classification','decision','approval','rejection','manual_update','bulk_action']).notNull(),
	eventSource: mysqlEnum("event_source", ['system','ai','reviewer','admin']).default('system').notNull(),
	route: varchar({ length: 32 }),
	previousStatus: mysqlEnum("previous_status", ['pending','approved','rejected','processing']),
	nextStatus: mysqlEnum("next_status", ['pending','approved','rejected','processing']),
	confidence: decimal({ precision: 5, scale: 4 }),
	notes: text(),
	payload: text(),
	actorUserId: int("actor_user_id").references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("review_event_content_idx").on(table.fetchedContentId),
	index("review_event_type_idx").on(table.eventType),
	index("review_event_actor_idx").on(table.actorUserId),
	index("review_event_created_idx").on(table.createdAt),
]);

export const comments = mysqlTable("comments", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: int("entity_id").notNull(),
	content: text().notNull(),
	parentId: int("parent_id"),
	isApproved: tinyint("is_approved").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("comment_user_idx").on(table.userId),
	index("comment_entity_idx").on(table.entityType, table.entityId),
	index("comment_approved_idx").on(table.isApproved),
]);

export const contactMessages = mysqlTable("contact_messages", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	message: text().notNull(),
	status: varchar({ length: 20 }).default('new').notNull(),
	userId: int("user_id").references(() => users.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
	id: int().autoincrement().notNull(),
	userId: int().references(() => users.id),
	title: varchar({ length: 500 }),
	category: mysqlEnum(['general','legal','jurisprudence','administrative','historical']).default('general').notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("user_idx").on(table.userId),
	index("idx_conversations_userId").on(table.userId),
	index("idx_conversations_userId_createdAt").on(table.userId, table.createdAt),
]);

export const documentFiles = mysqlTable("document_files", {
	id: int().autoincrement().notNull(),
	documentId: int("document_id").notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" } ),
	fileUrl: varchar("file_url", { length: 1000 }).notNull(),
	fileType: mysqlEnum("file_type", ['original','translation','supplement','other']).default('original').notNull(),
	fileName: varchar("file_name", { length: 500 }),
	fileSize: int("file_size"),
	language: varchar({ length: 10 }),
	extractedText: text("extracted_text"),
	isOcr: tinyint("is_ocr").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("document_idx").on(table.documentId),
	index("file_type_idx").on(table.fileType),
]);

export const faqs = mysqlTable("faqs", {
	id: int().autoincrement().notNull(),
	question: varchar({ length: 1000 }).notNull(),
	answer: text().notNull(),
	category: mysqlEnum(['general','conditions','types','management','legal','jurisprudence']).notNull(),
	order: int().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	viewCount: int().default(0).notNull(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("category_idx").on(table.category),
	index("order_idx").on(table.order),
	index("idx_faqs_category").on(table.category),
]);

export const favoriteConversations = mysqlTable("favorite_conversations", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	conversationId: int().notNull().references(() => conversations.id, { onDelete: "cascade" } ),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("user_idx").on(table.userId),
	index("conversation_idx").on(table.conversationId),
	index("unique_favorite").on(table.userId, table.conversationId),
]);

export const feedback = mysqlTable("feedback", {
	id: int().autoincrement().notNull(),
	messageId: int().references(() => messages.id, { onDelete: "cascade" } ),
	userId: int().references(() => users.id),
	rating: mysqlEnum(['helpful','not_helpful','partially_helpful']).notNull(),
	comment: text(),
	suggestedImprovement: text(),
	isReviewed: tinyint().default(0).notNull(),
	reviewedBy: int().references(() => users.id),
	reviewNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("message_idx").on(table.messageId),
	index("user_idx").on(table.userId),
	index("rating_idx").on(table.rating),
]);

export const fetchLogs = mysqlTable("fetch_logs", {
	id: int().autoincrement().notNull(),
	sourceId: int("source_id").notNull().references(() => knowledgeSources.id, { onDelete: "cascade" } ),
	status: mysqlEnum(['running','success','partial','failed']).notNull(),
	itemsFetched: int("items_fetched").default(0).notNull(),
	itemsApproved: int("items_approved").default(0).notNull(),
	itemsRejected: int("items_rejected").default(0).notNull(),
	errors: text(),
	startedAt: timestamp("started_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
},
(table) => [
	index("source_idx").on(table.sourceId),
	index("status_idx").on(table.status),
	index("started_at_idx").on(table.startedAt),
]);

	export const fetchedContent = mysqlTable("fetched_content", {
		id: int().autoincrement().notNull(),
		sourceId: int("source_id").notNull().references(() => knowledgeSources.id, { onDelete: "cascade" } ),
		title: varchar({ length: 500 }).notNull(),
		content: text().notNull(),
		author: varchar({ length: 200 }),
		url: varchar({ length: 1000 }),
		pdfUrl: varchar("pdf_url", { length: 1000 }),
		category: mysqlEnum(['law','jurisprudence','majalla','historical','administrative','reference']),
		tags: text(),
		relevanceScore: int("relevance_score"),
		status: mysqlEnum(['pending','approved','rejected','processing']).default('pending').notNull(),
		fetchedAt: timestamp("fetched_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
		reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
		reviewedBy: int("reviewed_by").references(() => users.id),
		// AI Processing fields
		aiCategory: mysqlEnum("ai_category", ['law','jurisprudence','majalla','historical','administrative','reference']),
		aiKeywords: text("ai_keywords"),
		aiSummary: text("ai_summary"),
		aiConfidence: decimal("ai_confidence", { precision: 5, scale: 4 }),
		aiReasoning: text("ai_reasoning"),
		processedAt: timestamp("processed_at", { mode: 'string' }),
		processingVersion: varchar("processing_version", { length: 50 }),
		processingError: text("processing_error"),
		// Dedupe + Versioning fields
		contentHash: varchar("content_hash", { length: 64 }),
		canonicalUrl: varchar("canonical_url", { length: 1000 }),
		versionGroup: varchar("version_group", { length: 64 }),
		versionNo: int("version_no").default(1).notNull(),
		isDuplicate: tinyint("is_duplicate").default(0).notNull(),
		duplicateOf: int("duplicate_of"),
		// PDF Extraction fields
		docDate: varchar("doc_date", { length: 10 }),
		docNumber: varchar("doc_number", { length: 64 }),
		issuer: varchar("issuer", { length: 255 }),
		docType: varchar("doc_type", { length: 32 }),
		language: varchar("language", { length: 8 }),
		pageCount: int("page_count"),
		extractedAt: varchar("extracted_at", { length: 19 }),
		extractionVersion: varchar("extraction_version", { length: 32 }),
		extractionError: text("extraction_error"),
	},
	(table) => [
		index("source_idx").on(table.sourceId),
		index("status_idx").on(table.status),
		index("relevance_idx").on(table.relevanceScore),
		index("fetched_at_idx").on(table.fetchedAt),
		index("idx_content_hash").on(table.contentHash),
		index("idx_version_group").on(table.versionGroup),
	]);

export const knowledgeChunks = mysqlTable("knowledge_chunks", {
	id: int("id").autoincrement().primaryKey(),
	sourceItemId: int("source_item_id").notNull(),
	chunkNo: int("chunk_no").notNull(),
	chunkText: text("chunk_text").notNull(),
	chunkHash: varchar("chunk_hash", { length: 64 }).notNull(),
	aiCategory: varchar("ai_category", { length: 32 }),
	tags: text("tags"),
	sourceType: varchar("source_type", { length: 32 }),
	sourceId: int("source_id"),
	canonicalUrl: varchar("canonical_url", { length: 1000 }),
	createdAt: varchar("created_at", { length: 19 }).notNull(),
},
(t) => ({
	idxItemNo: index("idx_kc_item_no").on(t.sourceItemId, t.chunkNo),
	idxHash: index("idx_kc_hash").on(t.chunkHash),
	idxSourceType: index("idx_kc_source_type").on(t.sourceType),
}));

export const files = mysqlTable("files", {
	id: int().autoincrement().notNull(),
	fileName: varchar("file_name", { length: 500 }).notNull(),
	fileKey: varchar("file_key", { length: 1000 }).notNull(),
	fileUrl: varchar("file_url", { length: 1000 }).notNull(),
	fileSize: int("file_size").notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	category: mysqlEnum(['documents','images','legal','administrative','other']).default('documents').notNull(),
	uploadedBy: int("uploaded_by").notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	linkedEntityType: mysqlEnum("linked_entity_type", ['deed','case','property','none']).default('none'),
	linkedEntityId: int("linked_entity_id"),
},
(table) => [
	index("category_idx").on(table.category),
	index("uploaded_by_idx").on(table.uploadedBy),
]);

export const homeSectionItems = mysqlTable("home_section_items", {
	id: int().autoincrement().notNull(),
	sectionId: int().notNull().references(() => homeSections.id, { onDelete: "cascade" } ),
	title: varchar({ length: 300 }).notNull(),
	description: text(),
	icon: varchar({ length: 100 }),
	imageUrl: varchar({ length: 1000 }),
	linkUrl: varchar({ length: 500 }),
	linkText: varchar({ length: 100 }),
	displayOrder: int().default(0).notNull(),
	isVisible: tinyint().default(1).notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("section_idx").on(table.sectionId),
	index("order_idx").on(table.displayOrder),
	index("visible_idx").on(table.isVisible),
]);

export const homeSections = mysqlTable("home_sections", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 100 }).$defaultFn(() => `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	order: int().default(0).notNull(),
	type: mysqlEnum(['hero','features','stats','cta','testimonials','faq','custom']).notNull(),
	isVisible: tinyint().default(1).notNull(),
	displayOrder: int().default(0).notNull(),
	maxItems: int().default(3),
	config: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	publishAt: timestamp({ mode: 'string' }),
	unpublishAt: timestamp({ mode: 'string' }),
	scheduledStatus: mysqlEnum(['draft','scheduled','published','unpublished']).default('draft').notNull(),
	templateId: int(),
	backgroundColor: varchar({ length: 50 }).default('#ffffff'),
	textColor: varchar({ length: 50 }).default('#000000'),
	layout: mysqlEnum(['full-width','centered','two-columns','three-columns','grid']).default('centered'),
	imageUrl: varchar({ length: 1000 }),
	ctaText: varchar({ length: 200 }),
	ctaLink: varchar({ length: 500 }),
},
(table) => [
	index("home_sections_key_unique").on(table.key),
	index("order_idx").on(table.displayOrder),
	index("visible_idx").on(table.isVisible),
]);

export const judicialRulings = mysqlTable("judicial_rulings", {
	id: int().autoincrement().notNull(),
	caseNumber: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	court: varchar({ length: 200 }).notNull(),
	judge: varchar({ length: 200 }),
	rulingDate: timestamp({ mode: 'string' }).notNull(),
	rulingType: mysqlEnum(['initial','appeal','supreme','cassation']).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	summary: text().notNull(),
	fullText: text(),
	legalPrinciple: text(),
	relatedArticles: text(),
	relatedCases: text(),
	propertyId: int().references(() => waqfProperties.id),
	caseId: int().references(() => waqfCases.id),
	status: mysqlEnum(['final','appealable','appealed']).default('final').notNull(),
	tags: text(),
	attachments: text(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("judicial_rulings_caseNumber_unique").on(table.caseNumber),
	index("case_number_idx").on(table.caseNumber),
	index("court_idx").on(table.court),
	index("ruling_date_idx").on(table.rulingDate),
]);

export const knowledgeDocuments = mysqlTable("knowledge_documents", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	category: mysqlEnum(['law','jurisprudence','majalla','historical','administrative','reference']).notNull(),
	source: varchar({ length: 500 }),
	sourceUrl: varchar({ length: 1000 }),
	tags: text(),
	isActive: tinyint().default(1).notNull(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	pdfUrl: varchar({ length: 1000 }),
	embedding: text(),
},
(table) => [
	index("category_idx").on(table.category),
	index("title_idx").on(table.title),
	index("idx_knowledge_documents_title").on(table.title),
	index("idx_knowledge_documents_category").on(table.category),
	index("").on(table.category),
]);

export const knowledgeSources = mysqlTable("knowledge_sources", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 200 }).notNull(),
	type: mysqlEnum(['wikipedia','rss','scraper','pdf_url','api']).notNull(),
	url: varchar({ length: 1000 }).notNull(),
	config: text(),
	isActive: tinyint("is_active").default(1).notNull(),
	fetchFrequency: mysqlEnum("fetch_frequency", ['manual','daily','weekly','monthly']).default('manual').notNull(),
	lastFetchAt: timestamp("last_fetch_at", { mode: 'string' }),
	itemsCount: int("items_count").default(0).notNull(),
	successCount: int("success_count").default(0).notNull(),
	errorCount: int("error_count").default(0).notNull(),
	createdBy: int("created_by").references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("type_idx").on(table.type),
	index("active_idx").on(table.isActive),
]);

export const landReferences = mysqlTable("land_references", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	description: text(),
	author: varchar({ length: 200 }),
	type: mysqlEnum(['ottoman_record','british_mandate','jordanian_law','israeli_document','palestinian_law','court_ruling','historical_map','land_registry','waqf_deed','other']).notNull(),
	region: varchar({ length: 200 }).notNull(),
	year: int().notNull(),
	sourceUrl: varchar("source_url", { length: 1000 }),
	pdfUrl: varchar("pdf_url", { length: 1000 }),
	tags: text(),
	isActive: tinyint("is_active").default(1).notNull(),
	createdBy: int("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("type_idx").on(table.type),
	index("region_idx").on(table.region),
	index("year_idx").on(table.year),
	index("title_idx").on(table.title),
]);

export const learningLog = mysqlTable("learning_log", {
	id: int().autoincrement().notNull(),
	query: varchar({ length: 1000 }).notNull(),
	originalResponse: text(),
	improvedResponse: text(),
	improvementReason: text(),
	feedbackCount: int().default(0).notNull(),
	averageRating: varchar({ length: 50 }),
	category: varchar({ length: 100 }),
	isApplied: tinyint().default(0).notNull(),
	appliedBy: int().references(() => users.id),
	appliedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("category_idx").on(table.category),
	index("is_applied_idx").on(table.isApplied),
]);

export const legalPrecedents = mysqlTable("legal_precedents", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	principle: text().notNull(),
	description: text().notNull(),
	category: mysqlEnum(['waqf_validity','waqf_administration','waqf_termination','property_rights','inheritance','transactions','disputes','general']).notNull(),
	sourceRulingId: int().references(() => judicialRulings.id),
	relatedRulings: text(),
	legalBasis: text(),
	shariaBasis: text(),
	applicationScope: text(),
	exceptions: text(),
	practicalImplications: text(),
	isActive: tinyint().default(1).notNull(),
	tags: text(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("category_idx").on(table.category),
	index("title_idx").on(table.title),
]);

export const messageRatings = mysqlTable("message_ratings", {
	id: int().autoincrement().notNull(),
	messageId: int("message_id").notNull().references(() => messages.id, { onDelete: "cascade" } ),
	userId: int("user_id").notNull().references(() => users.id),
	rating: mysqlEnum(['helpful','not_helpful']).notNull(),
	feedback: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("message_idx").on(table.messageId),
	index("user_idx").on(table.userId),
]);

export const messages = mysqlTable("messages", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull().references(() => conversations.id, { onDelete: "cascade" } ),
	role: mysqlEnum(['user','assistant','system']).notNull(),
	content: text().notNull(),
	sources: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("conversation_idx").on(table.conversationId),
	index("idx_messages_conversationId").on(table.conversationId),
	index("idx_messages_createdAt").on(table.createdAt),
]);

export const ministerialInstructions = mysqlTable("ministerial_instructions", {
	id: int().autoincrement().notNull(),
	instructionNumber: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	type: mysqlEnum(['circular','instruction','decision','regulation','guideline']).notNull(),
	category: mysqlEnum(['administrative','financial','legal','technical','general']).notNull(),
	issueDate: timestamp({ mode: 'string' }).notNull(),
	effectiveDate: timestamp({ mode: 'string' }),
	expiryDate: timestamp({ mode: 'string' }),
	issuedBy: varchar({ length: 200 }),
	attachments: text(),
	relatedInstructions: text(),
	tags: text(),
	isActive: tinyint().default(1).notNull(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("ministerial_instructions_instructionNumber_unique").on(table.instructionNumber),
	index("instruction_number_idx").on(table.instructionNumber),
	index("type_idx").on(table.type),
	index("category_idx").on(table.category),
	index("issue_date_idx").on(table.issueDate),
]);

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	type: mysqlEnum(['announcement','update','maintenance','alert','reply','comment','approval','system']).notNull(),
	targetAudience: mysqlEnum("target_audience", ['all','admins','users','specific']).default('all').notNull(),
	targetUserIds: text("target_user_ids"),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	status: mysqlEnum(['draft','scheduled','sent','cancelled']).default('draft').notNull(),
	sentCount: int("sent_count").default(0).notNull(),
	readCount: int("read_count").default(0).notNull(),
	createdBy: int("created_by").notNull().references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	userId: int("user_id").references(() => users.id, { onDelete: "cascade" } ),
	relatedId: int("related_id"),
	relatedType: varchar("related_type", { length: 50 }),
	isRead: tinyint("is_read").default(0).notNull(),
},
(table) => [
	index("type_idx").on(table.type),
	index("status_idx").on(table.status),
	index("scheduled_idx").on(table.scheduledFor),
]);

export const ottomanLandLaw = mysqlTable("ottoman_land_law", {
	id: int().autoincrement().notNull(),
	articleNumber: int().notNull(),
	title: varchar({ length: 500 }),
	arabicText: text().notNull(),
	turkishText: text(),
	englishTranslation: text(),
	category: mysqlEnum(['land_types','ownership','waqf','inheritance','transactions','rights','general']).notNull(),
	explanation: text(),
	relatedArticles: text(),
	modernApplication: text(),
	judicialInterpretation: text(),
	isActive: tinyint().default(1).notNull(),
	tags: text(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("ottoman_land_law_articleNumber_unique").on(table.articleNumber),
	index("article_number_idx").on(table.articleNumber),
	index("category_idx").on(table.category),
]);

export const ratings = mysqlTable("ratings", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: int("entity_id").notNull(),
	rating: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("unique_user_entity_rating").on(table.userId, table.entityType, table.entityId),
	index("rating_user_idx").on(table.userId),
	index("rating_entity_idx").on(table.entityType, table.entityId),
]);

export const searchLogs = mysqlTable("search_logs", {
	id: int().autoincrement().notNull(),
	userId: int().references(() => users.id),
	query: varchar({ length: 1000 }).notNull(),
	resultsCount: int().default(0).notNull(),
	wasHelpful: tinyint(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("user_idx").on(table.userId),
	index("created_at_idx").on(table.createdAt),
]);

export const siteSettings = mysqlTable("site_settings", {
	id: int().autoincrement().notNull(),
	siteName: varchar("site_name", { length: 255 }).default('نموذج الذكاء الصناعي للأوقاف').notNull(),
	siteDescription: text("site_description"),
	siteLanguage: varchar("site_language", { length: 10 }).default('ar').notNull(),
	primaryColor: varchar("primary_color", { length: 50 }).default('#2563eb'),
	secondaryColor: varchar("secondary_color", { length: 50 }).default('#10b981'),
	backgroundColor: varchar("background_color", { length: 50 }).default('#ffffff'),
	textColor: varchar("text_color", { length: 50 }).default('#1f2937'),
	accentColor: varchar("accent_color", { length: 50 }).default('#f59e0b'),
	headingFont: varchar("heading_font", { length: 255 }).default('\'Cairo\', sans-serif'),
	bodyFont: varchar("body_font", { length: 255 }).default('\'Tajawal\', sans-serif'),
	baseFontSize: int("base_font_size").default(16),
	logoUrl: varchar("logo_url", { length: 1000 }),
	faviconUrl: varchar("favicon_url", { length: 1000 }),
	menuItems: text("menu_items"),
	footerText: text("footer_text"),
	showSocialLinks: tinyint("show_social_links").default(1),
	theme: mysqlEnum(['light','dark','auto']).default('light'),
	updatedBy: int("updated_by").references(() => users.id),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	socialLinks: text("social_links"),
});

export const suggestedQuestions = mysqlTable("suggested_questions", {
	id: int().autoincrement().notNull(),
	question: text().notNull(),
	category: mysqlEnum(['legal','fiqh','administrative','historical']).notNull(),
	displayOrder: int("display_order").notNull(),
	isActive: tinyint("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("category_idx").on(table.category),
	index("active_idx").on(table.isActive),
	index("order_idx").on(table.displayOrder),
]);

export const systemSettings = mysqlTable("system_settings", {
	id: int().autoincrement().notNull(),
	registrationEnabled: tinyint("registration_enabled").default(1).notNull(),
	dailyQuestionLimit: int("daily_question_limit").default(50).notNull(),
	requireEmailVerification: tinyint("require_email_verification").default(0).notNull(),
	welcomeMessageEnabled: tinyint("welcome_message_enabled").default(1).notNull(),
	welcomeMessageTitle: varchar("welcome_message_title", { length: 500 }).default('مرحباً بك في نظام الأوقاف الإسلامية'),
	welcomeMessageContent: text("welcome_message_content"),
	emailEnabled: tinyint("email_enabled").default(0).notNull(),
	smtpHost: varchar("smtp_host", { length: 255 }),
	smtpPort: int("smtp_port").default(587),
	smtpUser: varchar("smtp_user", { length: 255 }),
	smtpPassword: varchar("smtp_password", { length: 255 }),
	emailFromAddress: varchar("email_from_address", { length: 255 }),
	emailFromName: varchar("email_from_name", { length: 255 }),
	maintenanceMode: tinyint("maintenance_mode").default(0).notNull(),
	maintenanceMessage: text("maintenance_message"),
	updatedBy: int("updated_by").references(() => users.id),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const userNotifications = mysqlTable("user_notifications", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	notificationId: int("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" } ),
	isRead: tinyint("is_read").default(0).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("user_idx").on(table.userId),
	index("notification_idx").on(table.notificationId),
	index("read_idx").on(table.isRead),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	isActive: tinyint().default(1).notNull(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const waqfCases = mysqlTable("waqf_cases", {
	id: int().autoincrement().notNull(),
	caseNumber: varchar({ length: 100 }).notNull(),
	propertyId: int().references(() => waqfProperties.id),
	title: varchar({ length: 500 }).notNull(),
	description: text().notNull(),
	caseType: mysqlEnum(['ownership_dispute','boundary_dispute','usage_violation','inheritance','management_dispute','encroachment','other']).notNull(),
	status: mysqlEnum(['pending','under_investigation','in_court','resolved','closed']).default('pending').notNull(),
	court: varchar({ length: 200 }),
	judge: varchar({ length: 200 }),
	plaintiff: varchar({ length: 200 }),
	defendant: varchar({ length: 200 }),
	filingDate: timestamp({ mode: 'string' }),
	hearingDate: timestamp({ mode: 'string' }),
	verdict: text(),
	verdictDate: timestamp({ mode: 'string' }),
	documents: text(),
	notes: text(),
	isActive: tinyint().default(1).notNull(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("waqf_cases_caseNumber_unique").on(table.caseNumber),
	index("case_number_idx").on(table.caseNumber),
	index("property_idx").on(table.propertyId),
	index("status_idx").on(table.status),
	index("case_type_idx").on(table.caseType),
	index("idx_cases_status").on(table.status),
]);

export const waqfCategories = mysqlTable("waqf_categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 200 }).notNull(),
	nameAr: varchar({ length: 200 }).notNull(),
	description: text(),
	icon: varchar({ length: 100 }),
	color: varchar({ length: 50 }),
	order: int().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("order_idx").on(table.order),
]);

export const waqfDeeds = mysqlTable("waqf_deeds", {
	id: int().autoincrement().notNull(),
	deedNumber: varchar({ length: 100 }).notNull(),
	deedDate: timestamp({ mode: 'string' }).notNull(),
	hijriDate: varchar({ length: 50 }),
	court: varchar({ length: 200 }).notNull(),
	judge: varchar({ length: 200 }),
	waqifName: varchar({ length: 300 }).notNull(),
	waqifDetails: text(),
	propertyDescription: text().notNull(),
	propertyLocation: varchar({ length: 500 }).notNull(),
	propertyBoundaries: text(),
	propertyArea: varchar({ length: 100 }),
	propertyId: int().references(() => waqfProperties.id),
	waqfType: mysqlEnum(['charitable','family','mixed']).notNull(),
	beneficiaries: text().notNull(),
	waqifConditions: text(),
	administratorName: varchar({ length: 300 }),
	administratorConditions: text(),
	fullText: text(),
	summary: text(),
	witnesses: text(),
	attachments: text(),
	status: mysqlEnum(['active','inactive','disputed','archived']).default('active').notNull(),
	notes: text(),
	tags: text(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("waqf_deeds_deedNumber_unique").on(table.deedNumber),
	index("deed_number_idx").on(table.deedNumber),
	index("deed_date_idx").on(table.deedDate),
	index("waqif_name_idx").on(table.waqifName),
]);

export const waqfProperties = mysqlTable("waqf_properties", {
	id: int().autoincrement().notNull(),
	nationalKey: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 500 }).notNull(),
	categoryId: int(),
	propertyType: mysqlEnum(['mosque','building','agricultural_land','shrine','cemetery','school','clinic','other']).notNull(),
	governorate: varchar({ length: 100 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	address: text(),
	area: varchar({ length: 100 }),
	waqfType: mysqlEnum(['charitable','family','mixed']).notNull(),
	status: mysqlEnum(['active','inactive','disputed','under_development']).default('active').notNull(),
	description: text(),
	documents: text(),
	coordinates: varchar({ length: 200 }),
	isActive: tinyint().default(1).notNull(),
	createdBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("waqf_properties_nationalKey_unique").on(table.nationalKey),
	index("national_key_idx").on(table.nationalKey),
	index("governorate_idx").on(table.governorate),
	index("property_type_idx").on(table.propertyType),
	index("status_idx").on(table.status),
	index("idx_properties_governorate").on(table.governorate),
	index("category_idx").on(table.categoryId),
]);

export const contentTemplates = mysqlTable("content_templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 200 }).notNull(),
	nameAr: varchar("name_ar", { length: 200 }).notNull(),
	description: text(),
	descriptionAr: text("description_ar"),
	type: mysqlEnum(['landing','about','services','portfolio','blog','documentation','dashboard','ecommerce','educational','nonprofit']).notNull(),
	sections: text().notNull(), // JSON array of section types
	layout: mysqlEnum(['full-width','centered','two-columns','three-columns','grid','sidebar']).default('centered'),
	colorScheme: varchar("color_scheme", { length: 100 }).default('blue'),
	thumbnail: varchar({ length: 1000 }),
	config: text(), // JSON configuration
	isActive: tinyint("is_active").default(1).notNull(),
	usageCount: int("usage_count").default(0).notNull(),
	createdBy: int("created_by").references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("type_idx").on(table.type),
	index("active_idx").on(table.isActive),
	index("created_by_idx").on(table.createdBy),
]);


// ============ Roles & Permissions Tables ============

export const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  isSystem: tinyint("is_system").default(0).notNull(), // 1 = system role (cannot be deleted)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const permissions = mysqlTable("permissions", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  resource: varchar("resource", { length: 50 }).notNull(), // e.g., "users", "content", "settings"
  action: varchar("action", { length: 50 }).notNull(), // e.g., "create", "read", "update", "delete"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").primaryKey().autoincrement(),
  roleId: int("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: int("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;


// Type exports for fetched content, fetch logs, knowledge sources, classification ratings
export type FetchedContent = typeof fetchedContent.$inferSelect;
export type InsertFetchedContent = typeof fetchedContent.$inferInsert;
export type FetchLog = typeof fetchLogs.$inferSelect;
export type InsertFetchLog = typeof fetchLogs.$inferInsert;
export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
export type InsertKnowledgeSource = typeof knowledgeSources.$inferInsert;
export type ClassificationRating = typeof classificationRatings.$inferSelect;
export type InsertClassificationRating = typeof classificationRatings.$inferInsert;
export type FetchedContentReviewEvent = typeof fetchedContentReviewEvents.$inferSelect;
export type InsertFetchedContentReviewEvent = typeof fetchedContentReviewEvents.$inferInsert;

// Page Settings Table
export const pageSettings = mysqlTable("page_settings", {
	id: int().autoincrement().primaryKey().notNull(),
	pageName: varchar("page_name", { length: 100 }).notNull().unique(),
	title: varchar({ length: 200 }),
	description: text(),
	metaKeywords: text("meta_keywords"),
	ogImage: varchar("og_image", { length: 500 }),
	customCss: text("custom_css"),
	customJs: text("custom_js"),
	isActive: tinyint("is_active").default(1).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Watchlists & Alerts Tables
export const watchlists = mysqlTable(
	"watchlists",
	{
		id: int().primaryKey().autoincrement(),
		name: varchar("name", { length: 120 }).notNull(),
		isActive: tinyint("is_active").default(1),
		query: text("query").notNull(),
		categories: text("categories"),
		sourceTypes: text("source_types"),
		statuses: varchar("statuses", { length: 100 }).default("pending,approved"),
		createdBy: varchar("created_by", { length: 255 }),
		createdAt: timestamp("created_at", { mode: "string" }).default(sql`now()`),
		updatedAt: timestamp("updated_at", { mode: "string" })
			.default(sql`now()`)
			.onUpdateNow(),
	},
	(table) => ({
		isActiveIdx: index("watchlists_is_active").on(table.isActive),
		createdByIdx: index("watchlists_created_by").on(table.createdBy),
	})
);

export const watchlistTemplates = mysqlTable(
	"watchlist_templates",
	{
		id: int().primaryKey().autoincrement(),
		name: varchar("name", { length: 120 }).notNull(),
		description: text("description"),
		query: text("query").notNull(),
		categories: text("categories"),
		sourceTypes: text("source_types"),
		statuses: varchar("statuses", { length: 100 }).default("pending,approved"),
		createdBy: varchar("created_by", { length: 255 }).notNull(),
		isPublic: tinyint("is_public").default(0),
		createdAt: timestamp("created_at", { mode: "string" }).default(sql`now()`),
		updatedAt: timestamp("updated_at", { mode: "string" })
			.default(sql`now()`)
			.onUpdateNow(),
	},
	(table) => ({
		createdByIdx: index("templates_created_by").on(table.createdBy),
		isPublicIdx: index("templates_is_public").on(table.isPublic),
	})
);

export const alerts = mysqlTable(
	"alerts",
	{
		id: int().primaryKey().autoincrement(),
		watchlistId: int("watchlist_id")
			.notNull()
			.references(() => watchlists.id, { onDelete: "cascade" }),
		sourceItemId: int("source_item_id")
			.notNull()
			.references(() => fetchedContent.id, { onDelete: "cascade" }),
		matchedOn: varchar("matched_on", { length: 32 }),
		score: int("score").default(0),
		status: varchar("status", { length: 16 }).default("new"),
		createdAt: timestamp("created_at", { mode: "string" }).default(sql`now()`),
	},
	(table) => ({
		uniqueConstraint: uniqueIndex("alerts_watchlist_source_unique").on(
			table.watchlistId,
			table.sourceItemId
		),
	})
);

	// Alert runs tracking table
export const alertRuns = mysqlTable(
	"alert_runs",
	{
		id: int().primaryKey().autoincrement(),
		startedAt: varchar("started_at", { length: 19 }).notNull(),
		finishedAt: varchar("finished_at", { length: 19 }),
		status: varchar("status", { length: 16 }).notNull().default("running"),
		createdCount: int("created_count").notNull().default(0),
		errorMessage: text("error_message"),
		trigger: varchar("trigger", { length: 16 }).notNull().default("manual"),
		lockKey: varchar("lock_key", { length: 64 }).notNull().default("watchlists_cron"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		idxStatus: index("idx_status").on(table.status),
		idxTrigger: index("idx_trigger").on(table.trigger),
		idxCreatedAt: index("idx_created_at").on(table.createdAt),
	})
);

// Scheduler locks table for distributed locking
export const schedulerLocks = mysqlTable(
	"scheduler_locks",
	{
		lockKey: varchar("lock_key", { length: 64 }).primaryKey(),
		lockedAt: timestamp("locked_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at").notNull(),
	},
	(table) => ({
		idxExpiresAt: index("idx_expires_at").on(table.expiresAt),
	})
);

	// Type exports for use in routers/db
export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = typeof watchlists.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
export type AlertRun = typeof alertRuns.$inferSelect;
export type InsertAlertRun = typeof alertRuns.$inferInsert;


// Legacy compatibility type aliases used by older server/client modules
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type FAQ = typeof faqs.$inferSelect;
export type InsertFAQ = typeof faqs.$inferInsert;
export type SearchLog = typeof searchLogs.$inferSelect;
export type InsertSearchLog = typeof searchLogs.$inferInsert;
export type WaqfProperty = typeof waqfProperties.$inferSelect;
export type InsertWaqfProperty = typeof waqfProperties.$inferInsert;
export type WaqfCase = typeof waqfCases.$inferSelect;
export type InsertWaqfCase = typeof waqfCases.$inferInsert;
export type MinisterialInstruction = typeof ministerialInstructions.$inferSelect;
export type InsertMinisterialInstruction = typeof ministerialInstructions.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;
export type DocumentFile = typeof documentFiles.$inferSelect;
export type InsertDocumentFile = typeof documentFiles.$inferInsert;
export type LearningLog = typeof learningLog.$inferSelect;
export type InsertLearningLog = typeof learningLog.$inferInsert;
export type JudicialRuling = typeof judicialRulings.$inferSelect;
export type InsertJudicialRuling = typeof judicialRulings.$inferInsert;
export type WaqfDeed = typeof waqfDeeds.$inferSelect;
export type InsertWaqfDeed = typeof waqfDeeds.$inferInsert;
export type OttomanLandLawArticle = typeof ottomanLandLaw.$inferSelect;
export type InsertOttomanLandLawArticle = typeof ottomanLandLaw.$inferInsert;
export type LegalPrecedent = typeof legalPrecedents.$inferSelect;
export type InsertLegalPrecedent = typeof legalPrecedents.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
export type CachedResponse = typeof cachedResponses.$inferSelect;
export type InsertCachedResponse = typeof cachedResponses.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;
export type HomeSection = typeof homeSections.$inferSelect;
export type InsertHomeSection = typeof homeSections.$inferInsert;
export type LandReference = typeof landReferences.$inferSelect;
export type InsertLandReference = typeof landReferences.$inferInsert;
export type WaqfCategory = typeof waqfCategories.$inferSelect;
export type InsertWaqfCategory = typeof waqfCategories.$inferInsert;
export type PageSetting = typeof pageSettings.$inferSelect;
export type InsertPageSetting = typeof pageSettings.$inferInsert;
export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;

// Legacy section template alias kept for older code paths
export const sectionTemplates = contentTemplates;
export type SectionTemplate = typeof contentTemplates.$inferSelect;
export type InsertSectionTemplate = typeof contentTemplates.$inferInsert;
