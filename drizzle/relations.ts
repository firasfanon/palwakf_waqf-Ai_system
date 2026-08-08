import { relations } from "drizzle-orm/relations";
import { users, attachments, bookmarks, knowledgeDocuments, fetchedContent, classificationRatings, comments, contactMessages, conversations, documentFiles, faqs, favoriteConversations, messages, feedback, knowledgeSources, fetchLogs, files, homeSections, homeSectionItems, waqfProperties, judicialRulings, waqfCases, learningLog, legalPrecedents, messageRatings, ministerialInstructions, notifications, ottomanLandLaw, ratings, searchLogs, siteSettings, systemSettings, userNotifications, waqfDeeds } from "./schema";

export const attachmentsRelations = relations(attachments, ({one}) => ({
	user: one(users, {
		fields: [attachments.uploadedBy],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	attachments: many(attachments),
	bookmarks: many(bookmarks),
	classificationRatings: many(classificationRatings),
	comments: many(comments),
	contactMessages: many(contactMessages),
	conversations: many(conversations),
	faqs: many(faqs),
	favoriteConversations: many(favoriteConversations),
	feedbacks_userId: many(feedback, {
		relationName: "feedback_userId_users_id"
	}),
	feedbacks_reviewedBy: many(feedback, {
		relationName: "feedback_reviewedBy_users_id"
	}),
	fetchedContents: many(fetchedContent),
	files: many(files),
	judicialRulings: many(judicialRulings),
	knowledgeDocuments: many(knowledgeDocuments),
	knowledgeSources: many(knowledgeSources),
	learningLogs: many(learningLog),
	legalPrecedents: many(legalPrecedents),
	messageRatings: many(messageRatings),
	ministerialInstructions: many(ministerialInstructions),
	notifications_createdBy: many(notifications, {
		relationName: "notifications_createdBy_users_id"
	}),
	notifications_userId: many(notifications, {
		relationName: "notifications_userId_users_id"
	}),
	ottomanLandLaws: many(ottomanLandLaw),
	ratings: many(ratings),
	searchLogs: many(searchLogs),
	siteSettings: many(siteSettings),
	systemSettings: many(systemSettings),
	userNotifications: many(userNotifications),
	waqfCases: many(waqfCases),
	waqfDeeds: many(waqfDeeds),
	waqfProperties: many(waqfProperties),
}));

export const bookmarksRelations = relations(bookmarks, ({one}) => ({
	user: one(users, {
		fields: [bookmarks.userId],
		references: [users.id]
	}),
	knowledgeDocument: one(knowledgeDocuments, {
		fields: [bookmarks.documentId],
		references: [knowledgeDocuments.id]
	}),
}));

export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({one, many}) => ({
	bookmarks: many(bookmarks),
	documentFiles: many(documentFiles),
	user: one(users, {
		fields: [knowledgeDocuments.createdBy],
		references: [users.id]
	}),
}));

export const classificationRatingsRelations = relations(classificationRatings, ({one}) => ({
	fetchedContent: one(fetchedContent, {
		fields: [classificationRatings.fetchedContentId],
		references: [fetchedContent.id]
	}),
	user: one(users, {
		fields: [classificationRatings.ratedBy],
		references: [users.id]
	}),
}));

export const fetchedContentRelations = relations(fetchedContent, ({one, many}) => ({
	classificationRatings: many(classificationRatings),
	knowledgeSource: one(knowledgeSources, {
		fields: [fetchedContent.sourceId],
		references: [knowledgeSources.id]
	}),
	user: one(users, {
		fields: [fetchedContent.reviewedBy],
		references: [users.id]
	}),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
}));

export const contactMessagesRelations = relations(contactMessages, ({one}) => ({
	user: one(users, {
		fields: [contactMessages.userId],
		references: [users.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user: one(users, {
		fields: [conversations.userId],
		references: [users.id]
	}),
	favoriteConversations: many(favoriteConversations),
	messages: many(messages),
}));

export const documentFilesRelations = relations(documentFiles, ({one}) => ({
	knowledgeDocument: one(knowledgeDocuments, {
		fields: [documentFiles.documentId],
		references: [knowledgeDocuments.id]
	}),
}));

export const faqsRelations = relations(faqs, ({one}) => ({
	user: one(users, {
		fields: [faqs.createdBy],
		references: [users.id]
	}),
}));

export const favoriteConversationsRelations = relations(favoriteConversations, ({one}) => ({
	user: one(users, {
		fields: [favoriteConversations.userId],
		references: [users.id]
	}),
	conversation: one(conversations, {
		fields: [favoriteConversations.conversationId],
		references: [conversations.id]
	}),
}));

export const feedbackRelations = relations(feedback, ({one}) => ({
	message: one(messages, {
		fields: [feedback.messageId],
		references: [messages.id]
	}),
	user_userId: one(users, {
		fields: [feedback.userId],
		references: [users.id],
		relationName: "feedback_userId_users_id"
	}),
	user_reviewedBy: one(users, {
		fields: [feedback.reviewedBy],
		references: [users.id],
		relationName: "feedback_reviewedBy_users_id"
	}),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	feedbacks: many(feedback),
	messageRatings: many(messageRatings),
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
}));

export const fetchLogsRelations = relations(fetchLogs, ({one}) => ({
	knowledgeSource: one(knowledgeSources, {
		fields: [fetchLogs.sourceId],
		references: [knowledgeSources.id]
	}),
}));

export const knowledgeSourcesRelations = relations(knowledgeSources, ({one, many}) => ({
	fetchLogs: many(fetchLogs),
	fetchedContents: many(fetchedContent),
	user: one(users, {
		fields: [knowledgeSources.createdBy],
		references: [users.id]
	}),
}));

export const filesRelations = relations(files, ({one}) => ({
	user: one(users, {
		fields: [files.uploadedBy],
		references: [users.id]
	}),
}));

export const homeSectionItemsRelations = relations(homeSectionItems, ({one}) => ({
	homeSection: one(homeSections, {
		fields: [homeSectionItems.sectionId],
		references: [homeSections.id]
	}),
}));

export const homeSectionsRelations = relations(homeSections, ({many}) => ({
	homeSectionItems: many(homeSectionItems),
}));

export const judicialRulingsRelations = relations(judicialRulings, ({one, many}) => ({
	waqfProperty: one(waqfProperties, {
		fields: [judicialRulings.propertyId],
		references: [waqfProperties.id]
	}),
	waqfCase: one(waqfCases, {
		fields: [judicialRulings.caseId],
		references: [waqfCases.id]
	}),
	user: one(users, {
		fields: [judicialRulings.createdBy],
		references: [users.id]
	}),
	legalPrecedents: many(legalPrecedents),
}));

export const waqfPropertiesRelations = relations(waqfProperties, ({one, many}) => ({
	judicialRulings: many(judicialRulings),
	waqfCases: many(waqfCases),
	waqfDeeds: many(waqfDeeds),
	user: one(users, {
		fields: [waqfProperties.createdBy],
		references: [users.id]
	}),
}));

export const waqfCasesRelations = relations(waqfCases, ({one, many}) => ({
	judicialRulings: many(judicialRulings),
	waqfProperty: one(waqfProperties, {
		fields: [waqfCases.propertyId],
		references: [waqfProperties.id]
	}),
	user: one(users, {
		fields: [waqfCases.createdBy],
		references: [users.id]
	}),
}));

export const learningLogRelations = relations(learningLog, ({one}) => ({
	user: one(users, {
		fields: [learningLog.appliedBy],
		references: [users.id]
	}),
}));

export const legalPrecedentsRelations = relations(legalPrecedents, ({one}) => ({
	judicialRuling: one(judicialRulings, {
		fields: [legalPrecedents.sourceRulingId],
		references: [judicialRulings.id]
	}),
	user: one(users, {
		fields: [legalPrecedents.createdBy],
		references: [users.id]
	}),
}));

export const messageRatingsRelations = relations(messageRatings, ({one}) => ({
	message: one(messages, {
		fields: [messageRatings.messageId],
		references: [messages.id]
	}),
	user: one(users, {
		fields: [messageRatings.userId],
		references: [users.id]
	}),
}));

export const ministerialInstructionsRelations = relations(ministerialInstructions, ({one}) => ({
	user: one(users, {
		fields: [ministerialInstructions.createdBy],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one, many}) => ({
	user_createdBy: one(users, {
		fields: [notifications.createdBy],
		references: [users.id],
		relationName: "notifications_createdBy_users_id"
	}),
	user_userId: one(users, {
		fields: [notifications.userId],
		references: [users.id],
		relationName: "notifications_userId_users_id"
	}),
	userNotifications: many(userNotifications),
}));

export const ottomanLandLawRelations = relations(ottomanLandLaw, ({one}) => ({
	user: one(users, {
		fields: [ottomanLandLaw.createdBy],
		references: [users.id]
	}),
}));

export const ratingsRelations = relations(ratings, ({one}) => ({
	user: one(users, {
		fields: [ratings.userId],
		references: [users.id]
	}),
}));

export const searchLogsRelations = relations(searchLogs, ({one}) => ({
	user: one(users, {
		fields: [searchLogs.userId],
		references: [users.id]
	}),
}));

export const siteSettingsRelations = relations(siteSettings, ({one}) => ({
	user: one(users, {
		fields: [siteSettings.updatedBy],
		references: [users.id]
	}),
}));

export const systemSettingsRelations = relations(systemSettings, ({one}) => ({
	user: one(users, {
		fields: [systemSettings.updatedBy],
		references: [users.id]
	}),
}));

export const userNotificationsRelations = relations(userNotifications, ({one}) => ({
	user: one(users, {
		fields: [userNotifications.userId],
		references: [users.id]
	}),
	notification: one(notifications, {
		fields: [userNotifications.notificationId],
		references: [notifications.id]
	}),
}));

export const waqfDeedsRelations = relations(waqfDeeds, ({one}) => ({
	waqfProperty: one(waqfProperties, {
		fields: [waqfDeeds.propertyId],
		references: [waqfProperties.id]
	}),
	user: one(users, {
		fields: [waqfDeeds.createdBy],
		references: [users.id]
	}),
}));