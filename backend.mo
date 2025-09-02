import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Option "mo:base/Option";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Float "mo:base/Float";

actor FormManager {

  //========================================
  // Define Types for Each Form
  //========================================

  // Status Enum
  type Status = {
    #Pending;
    #Approved;
    #Rejected;
  };

  // General Inquiry Form Type
  type GeneralInquiry = {
    id : Text;
    name : Text;
    email : Text;
    subject : Text;
    message : Text;
    status : Text;
    timestamp : Int;
  };

  // Book Consultancy Form Type
  type ConsultancyBooking = {
    id : Text;
    name : Text;
    email : Text;
    phone : Text;
    consultationType : Text;
    preferredDate : Int;
    preferredTime : Text;
    message : Text;
    status : Text;
    timestamp : Int;
  };

  // Project Development Form Type
  type ProjectDevelopment = {
    id : Text;
    name : Text;
    email : Text;
    businessName : ?Text;
    budgetEstimate : Nat;
    projectDetails : Text;
    preferredDate : Int;
    preferredTime : Text;
    status : Text;
    timestamp : Int;
  };

  //========================================
  // Initialize HashMaps to Store Form Data
  //========================================
  private stable var generalInquiryEntries : [(Text, GeneralInquiry)] = [];
  private stable var consultancyBookingEntries : [(Text, ConsultancyBooking)] = [];
  private stable var projectDevelopmentEntries : [(Text, ProjectDevelopment)] = [];

  private var generalInquiries = HashMap.HashMap<Text, GeneralInquiry>(0, Text.equal, Text.hash);
  private var consultancyBookings = HashMap.HashMap<Text, ConsultancyBooking>(0, Text.equal, Text.hash);
  private var projectDevelopments = HashMap.HashMap<Text, ProjectDevelopment>(0, Text.equal, Text.hash);

  //========================================
  // Functions for General Inquiry
  //========================================

  public func createGeneralInquiry(id : Text, name : Text, email : Text, subject : Text, message : Text) : async Bool {
    let timestamp = Time.now();
    let newEntry : GeneralInquiry = {
      id = id;
      name = name;
      email = email;
      subject = subject;
      message = message;
      status = "Pending";
      timestamp = timestamp;
    };
    generalInquiries.put(id, newEntry);
    return true;
  };

  public query func getGeneralInquiry(id : Text) : async ?GeneralInquiry {
    return generalInquiries.get(id);
  };

  public query func getAllGeneralInquiries() : async [GeneralInquiry] {
    return Iter.toArray(generalInquiries.vals());
  };

  public func deleteGeneralInquiry(id : Text) : async Bool {
    switch (generalInquiries.get(id)) {
      case (?_) {
        generalInquiries.delete(id);
        return true;
      };
      case null {
        return false;
      };
    };
  };

  //========================================
  // Functions for Booking Consultancy
  //========================================

  public func createConsultancyBooking(id : Text, name : Text, email : Text, phone : Text, consultationType : Text, preferredDate : Int, preferredTime : Text, message : Text) : async Bool {
    let timestamp = Time.now();
    let newEntry : ConsultancyBooking = {
      id = id;
      name = name;
      email = email;
      phone = phone;
      consultationType = consultationType;
      preferredDate = preferredDate;
      preferredTime = preferredTime;
      message = message;
      status = "Pending";
      timestamp = timestamp;
    };
    consultancyBookings.put(id, newEntry);
    return true;
  };

  public query func getConsultancyBooking(id : Text) : async ?ConsultancyBooking {
    return consultancyBookings.get(id);
  };

  public query func getAllConsultancyBookings() : async [ConsultancyBooking] {
    return Iter.toArray(consultancyBookings.vals());
  };

  public func deleteConsultancyBooking(id : Text) : async Bool {
    switch (consultancyBookings.get(id)) {
      case (?_) {
        consultancyBookings.delete(id);
        return true;
      };
      case null {
        return false;
      };
    };
  };

  //========================================
  // Functions for Project Development
  //========================================

  public func createProjectDevelopment(id : Text, name : Text, email : Text, businessName : Text, budgetEstimate : Nat, projectDetails : Text, preferredDate : Int, preferredTime : Text) : async Bool {
    let timestamp = Time.now();
    let newEntry : ProjectDevelopment = {
      id = id;
      name = name;
      email = email;
      businessName = ?businessName;
      budgetEstimate = budgetEstimate;
      projectDetails = projectDetails;
      preferredDate = preferredDate;
      preferredTime = preferredTime;
      status = "Pending";
      timestamp = timestamp;
    };
    projectDevelopments.put(id, newEntry);
    return true;
  };

  public query func getProjectDevelopment(id : Text) : async ?ProjectDevelopment {
    return projectDevelopments.get(id);
  };

  public query func getAllProjectDevelopments() : async [ProjectDevelopment] {
    return Iter.toArray(projectDevelopments.vals());
  };

  public func deleteProjectDevelopment(id : Text) : async Bool {
    switch (projectDevelopments.get(id)) {
      case (?_) {
        projectDevelopments.delete(id);
        return true;
      };
      case null {
        return false;
      };
    };
  };

  public func updateGeneralInquiryStatus(id : Text, newStatus : Text) : async Bool {
    switch (generalInquiries.get(id)) {
      case (?entry) {
        let updatedEntry = {
          entry with status = newStatus;
        };
        generalInquiries.put(id, updatedEntry);
        return true;
      };
      case null { return false };
    };
  };

  public func updateConsultancyStatus(id : Text, newStatus : Text) : async Bool {
    switch (consultancyBookings.get(id)) {
      case (?entry) {
        let updatedEntry = {
          entry with status = newStatus;
        };
        consultancyBookings.put(id, updatedEntry);
        return true;
      };
      case null { return false };
    };
  };

  public func updateProjectStatus(id : Text, newStatus : Text) : async Bool {
    switch (projectDevelopments.get(id)) {
      case (?entry) {
        let updatedEntry = {
          entry with status = newStatus;
        };
        projectDevelopments.put(id, updatedEntry);
        return true;
      };
      case null { return false };
    };
  };

  //========================================

  //========================================

  // Define review structure
  type Review = {
    id : Text;
    name : Text;
    company : Text;
    location : Text;
    continent : Text;
    flag : Text;
    rating : Nat;
    image : Text;
    testimonial : Text;
    featured : Bool;
    timestamp : Int;
  };

  // Stable variable for persisting data
  private stable var reviewEntries : [(Text, Review)] = [];
  // HashMap to store reviews
  private var reviews = HashMap.HashMap<Text, Review>(0, Text.equal, Text.hash);

  public func createReview(
    id : Text,
    name : Text,
    company : Text,
    location : Text,
    continent : Text,
    flag : Text,
    rating : Nat,
    image : Text,
    testimonial : Text,
    featured : Bool,
    timestamp : Int, // User-provided timestamp
  ) : async Bool {
    let timestamp2 = Time.now();
    let newReview : Review = {
      id = id;
      name = name;
      company = company;
      location = location;
      continent = continent;
      flag = flag;
      rating = rating;
      image = image;
      testimonial = testimonial;
      featured = featured;
      timestamp = timestamp; // Use user-provided timestamp
    };
    reviews.put(id, newReview);
    return true;
  };

  // Get a review by ID
  public query func getReview(id : Text) : async ?Review {
    return reviews.get(id);
  };

  // Get all reviews
  public query func getAllReviews() : async [Review] {
    return Iter.toArray(reviews.vals());
  };

  // Get reviews filtered by continent
  public query func getReviewsByContinent(continent : Text) : async [Review] {
    let filtered = Iter.filter<Review>(reviews.vals(), func(r) = (r.continent == continent));
    return Iter.toArray(filtered);
  };

  // Get featured reviews for carousel
  public query func getFeaturedReviews() : async [Review] {
    let filtered = Iter.filter<Review>(reviews.vals(), func(r) = r.featured);
    return Iter.toArray(filtered);
  };

  // Update a review's details
  public func updateReview(
    id : Text,
    name : Text,
    company : Text,
    location : Text,
    continent : Text,
    flag : Text,
    rating : Nat,
    image : Text,
    testimonial : Text,
    featured : Bool,
  ) : async Bool {
    switch (reviews.get(id)) {
      case (?_) {
        let updatedReview : Review = {
          id = id;
          name = name;
          company = company;
          location = location;
          continent = continent;
          flag = flag;
          rating = rating;
          image = image;
          testimonial = testimonial;
          featured = featured;
          timestamp = Time.now();
        };
        reviews.put(id, updatedReview);
        return true;
      };
      case null {
        return false;
      };
    };
  };

  // Delete a review
  public func deleteReview(id : Text) : async Bool {
    switch (reviews.get(id)) {
      case (?_) {
        reviews.delete(id);
        return true;
      };
      case null {
        return false;
      };
    };
  };

  //========================================
  // Subscription Type and Storage
  //========================================

  type Subscription = {
    id : Text;
    templateId : Nat;
    purchaser : Principal;
    costICP : Nat;
    startDate : Int;
    name : Text;
    email : Text;
    description : Text;
    status : Text;
    addons : ?Text; // Store JSON as string

  };

  private stable var subscriptionEntries : [(Text, Subscription)] = [];

  private var subscriptions = HashMap.HashMap<Text, Subscription>(0, Text.equal, Text.hash);

  public func createSubscription(
    templateId : Nat,
    purchaser : Principal,
    costICP : Nat,
    name : Text,
    email : Text,
    description : Text,
    addons : Text, // <-- New field as JSON string
  ) : async Bool {
    let id = Int.toText(Time.now());
    let subscription : Subscription = {
      id = id;
      templateId = templateId;
      purchaser = purchaser;
      costICP = costICP;
      startDate = Time.now();
      name = name;
      email = email;
      description = description;
      status = "pending";
      addons = ?addons;
    };
    subscriptions.put(id, subscription);
    return true;
  };

  public query func getSubscription(id : Text) : async ?Subscription {
    return subscriptions.get(id);
  };
  public query func getAllSubscriptions() : async [Subscription] {
    return Iter.toArray(subscriptions.vals());
  };

  public query func getSubscriptionsByPrincipal(principal : Principal) : async [Subscription] {
    let filtered = Iter.filter<Subscription>(subscriptions.vals(), func(s) = s.purchaser == principal);
    return Iter.toArray(filtered);
  };

  public query func getSubscriptionsByPrincipalUser(purchaser : Principal) : async [Subscription] {
    let filteredSubs = Iter.filter<Subscription>(
      subscriptions.vals(),
      func(sub : Subscription) : Bool {
        sub.purchaser == purchaser;
      },
    );
    return Iter.toArray(filteredSubs);
  };

  public func updateSubscriptionStatus(id : Text, newStatus : Text) : async Bool {
    switch (subscriptions.get(id)) {
      case (null) {
        return false; // Subscription not found
      };
      case (?sub) {
        let updatedSub : Subscription = {
          id = sub.id;
          templateId = sub.templateId;
          purchaser = sub.purchaser;
          costICP = sub.costICP;
          startDate = sub.startDate;
          name = sub.name;
          email = sub.email;
          description = sub.description;
          addons = sub.addons;
          status = newStatus;
        };
        subscriptions.put(id, updatedSub);
        return true;
      };
    };
  };

  /////////////////////////
  // Types (tabs mapped) //
  /////////////////////////

  // Details tab
  type BlogDetails = {
    title : Text;
    slug : Text; // unique across posts
    author : Text;
    excerpt : Text; // short summary for preview cards
    tags : [Text]; // e.g. ["icp", "web3", "react"]
    published : Bool;
  };

  // Content tab
  type BlogContent = {
    body : Text; // store rich text/HTML/Markdown as Text
  };

  // Media tab
  type BlogMedia = {
    coverImageUrl : ?Text; // optional external URL
    coverImageBase64 : ?Text; // optional uploaded base64
    galleryImagesBase64 : [Text]; // optional gallery (base64 list)
  };

  // SEO tab
  type BlogSEO = {
    metaTitle : ?Text; // keep under ~60 chars (frontend will enforce)
    metaDescription : ?Text; // keep under ~160 chars
  };

  // Full blog record
  type Blog = {
    id : Text; // generated on create
    details : BlogDetails;
    content : BlogContent;
    media : BlogMedia;
    seo : BlogSEO;
    createdAt : Int; // Time.now() (ns)
    updatedAt : Int; // Time.now() (ns)
  };

  // For simple updates without forcing clients to resend everything
  type BlogPatch = {
    details : ?BlogDetails;
    content : ?BlogContent;
    media : ?BlogMedia;
    seo : ?BlogSEO;
    published : ?Bool; // convenience toggle (also inside details)
  };

  /////////////////////////
  // Storage (upgrade)   //
  /////////////////////////

  // Stable dump used by preupgrade/postupgrade
  private stable var blogEntries : [(Text, Blog)] = [];

  // Runtime HashMap: id -> Blog
  private var blogs = HashMap.HashMap<Text, Blog>(0, Text.equal, Text.hash);

  // Secondary index for slug uniqueness & fast lookup
  private stable var slugIndexEntries : [(Text, Text)] = []; // (slug -> id)
  private var slugIndex = HashMap.HashMap<Text, Text>(0, Text.equal, Text.hash);

  /////////////////////////
  // Helpers             //
  /////////////////////////

  func now() : Int = Time.now();

  /// create a unique id based on time; callers don’t supply ids
  func genId() : Text = Int.toText(Time.now());

  /// Ensure slug is unique (case-sensitive). Return existing id if found.
  func getIdBySlug(s : Text) : ?Text = slugIndex.get(s);

  /////////////////////////
  // Create / Read / ... //
  /////////////////////////

  /// Create a new blog. Fails if slug already exists.
  // Create using individual fields (no nested inputs from caller)
  public func createBlog(
    // Details
    title : Text,
    slug : Text,
    author : Text,
    excerpt : Text,
    tags : [Text],
    published : Bool,

    // Content
    body : Text,

    // Media
    coverImageUrl : ?Text,
    coverImageBase64 : ?Text,
    galleryImagesBase64 : [Text],

    // SEO
    metaTitle : ?Text,
    metaDescription : ?Text,
  ) : async ?Blog {
    // slug uniqueness
    switch (getIdBySlug(slug)) {
      case (?_) { return null };
      case null {};
    };

    let details : BlogDetails = {
      title = title;
      slug = slug;
      author = author;
      excerpt = excerpt;
      tags = tags;
      published = published;
    };

    let content : BlogContent = { body = body };

    let media : BlogMedia = {
      coverImageUrl = coverImageUrl;
      coverImageBase64 = coverImageBase64;
      galleryImagesBase64 = galleryImagesBase64;
    };

    let seo : BlogSEO = {
      metaTitle = metaTitle;
      metaDescription = metaDescription;
    };

    let id = genId();
    let t = now();

    let record : Blog = {
      id = id;
      details = details;
      content = content;
      media = media;
      seo = seo;
      createdAt = t;
      updatedAt = t;
    };

    blogs.put(id, record);
    slugIndex.put(slug, id);
    ?record;
  };

  /// Get by ID
  public query func getBlog(id : Text) : async ?Blog {
    blogs.get(id);
  };

  /// Get by slug
  public query func getBlogBySlug(slug : Text) : async ?Blog {
    switch (slugIndex.get(slug)) {
      case null null;
      case (?id) blogs.get(id);
    };
  };

  /// List all (optionally filter by published, tags contains-any, simple paging)
  // ✅ Fixed: listBlogs
  // List with non-optional params
  // - applyPublishedFilter=false => ignore onlyPublished
  // - tagFilterAny=[]           => no tag filter
  public query func listBlogs(
    applyPublishedFilter : Bool,
    onlyPublished : Bool,
    tagFilterAny : [Text],
    offset : Nat,
    limit : Nat,
  ) : async [Blog] {
    let items : [Blog] = Iter.toArray(blogs.vals());

    let filtered : [Blog] = Array.filter<Blog>(
      items,
      func(b : Blog) : Bool {
        let publishOk = if (applyPublishedFilter) {
          b.details.published == onlyPublished;
        } else { true };

        let tagsOk = if (Array.size(tagFilterAny) == 0) {
          true;
        } else {
          // contains-any
          var hit = false;
          label scan for (t in Iter.fromArray(tagFilterAny)) {
            for (bt in Iter.fromArray(b.details.tags)) {
              if (bt == t) { hit := true; break scan };
            };
          };
          hit;
        };

        publishOk and tagsOk;
      },
    );

    let n : Nat = Array.size(filtered);
    if (offset >= n) { return [] };
    let endExclusive : Nat = if (limit == 0) n else Nat.min(n, offset + limit);
    Array.subArray<Blog>(filtered, offset, endExclusive - offset);
  };

  /// Count (optionally onlyPublished)
  public query func countBlogs(onlyPublished : Bool) : async Nat {
    var c : Nat = 0;
    for (b in blogs.vals()) {
      if (
        switch (?onlyPublished) {
          case null true;
          case (?flag) b.details.published == flag;
        }
      ) { c += 1 };
    };
    c;
  };

  /// Update *partial* fields by ID (does not allow slug collision)
  // ✅ Fixed: updateBlog
  // Update using individual fields (full overwrite)
  public func updateBlogFields(
    id : Text,

    // Details
    title : Text,
    slug : Text,
    author : Text,
    excerpt : Text,
    tags : [Text],
    published : Bool,

    // Content
    body : Text,

    // Media
    coverImageUrl : ?Text,
    coverImageBase64 : ?Text,
    galleryImagesBase64 : [Text],

    // SEO
    metaTitle : ?Text,
    metaDescription : ?Text,
  ) : async ?Blog {
    switch (blogs.get(id)) {
      case null { null };
      case (?old) {
        // If slug changed, ensure uniqueness (allow same id to keep its slug)
        if (slug != old.details.slug) {
          switch (getIdBySlug(slug)) {
            case (?existingId) { if (existingId != id) { return null } };
            case null {};
          };
          // update slug index: remove old, add new
          ignore slugIndex.delete(old.details.slug);
          slugIndex.put(slug, id);
        };

        let newDetails : BlogDetails = {
          title = title;
          slug = slug;
          author = author;
          excerpt = excerpt;
          tags = tags;
          published = published;
        };

        let newContent : BlogContent = { body = body };

        let newMedia : BlogMedia = {
          coverImageUrl = coverImageUrl;
          coverImageBase64 = coverImageBase64;
          galleryImagesBase64 = galleryImagesBase64;
        };

        let newSEO : BlogSEO = {
          metaTitle = metaTitle;
          metaDescription = metaDescription;
        };

        let updated : Blog = {
          id = old.id;
          details = newDetails;
          content = newContent;
          media = newMedia;
          seo = newSEO;
          createdAt = old.createdAt;
          updatedAt = now();
        };

        blogs.put(id, updated);
        ?updated;
      };
    };
  };

  /// Update only publish boolean quickly (by id)
  public func setBlogPublished(id : Text, published : Bool) : async Bool {
    switch (blogs.get(id)) {
      case null false;
      case (?b) {
        let d = { b.details with published = published };
        blogs.put(id, { b with details = d; updatedAt = now() });
        true;
      };
    };
  };

  /// Delete by id
  public func deleteBlog(id : Text) : async Bool {
    switch (blogs.get(id)) {
      case null false;
      case (?b) {
        // clean secondary index
        ignore slugIndex.remove(b.details.slug);
        blogs.delete(id);
        true;
      };
    };
  };

  // All blogs (no filters)
  public query func getAllBlogs() : async [Blog] {
    Iter.toArray(blogs.vals());
  };

  // All blogs with naive pagination
  public query func getAllBlogsPaged(offset : Nat, limit : Nat) : async [Blog] {
    let items : [Blog] = Iter.toArray(blogs.vals());
    let n = Array.size(items);
    if (offset >= n) { return [] };
    let endExclusive = if (limit == 0) n else Nat.min(n, offset + limit);
    Array.subArray<Blog>(items, offset, endExclusive - offset);
  };

  // Only published blogs (handy sugar)
  public query func getAllPublishedBlogs() : async [Blog] {
    Array.filter<Blog>(
      Iter.toArray(blogs.vals()),
      func(b : Blog) : Bool { b.details.published },
    );
  };

  //==========================================================================
  //==========================================================================

  // Types
  public type TransactionId = Text;
  public type ChainType = {
    #ETH;
    #BTC;
    #SOL;
    #POLYGON;
    #ARBITRUM;
    #OPTIMISM;
  };

  public type TransactionStatus = {
    #PENDING;
    #CONFIRMED;
    #REWARD_SENT;
    #FAILED;
    #EXPIRED;
  };

  public type Transaction = {
    id : TransactionId;
    userAddress : Text;
    depositAddress : Text;
    chain : ChainType;
    amount : Float;
    status : TransactionStatus;
    createdAt : Time.Time;
    confirmedAt : ?Time.Time;
    rewardSentAt : ?Time.Time;
    fundingTxHash : ?Text;
    rewardTxHash : ?Text;
    explorerUrl : ?Text;
  };

  public type FundingRequest = {
    userAddress : Text;
    chain : ChainType;
    amount : Float;
  };

  public type FundingResponse = {
    #Success : {
      transactionId : TransactionId;
      depositAddress : Text;
      qrData : Text;
      expiresAt : Time.Time;
      minConfirmations : Nat;
    };
    #Error : Text;
  };

  public type StatusResponse = {
    #Success : {
      status : TransactionStatus;
      confirmations : Nat;
      fundedAmount : ?Float;
      fundingTxHash : ?Text;
      rewardTxHash : ?Text;
      explorerUrl : ?Text;
    };
    #Error : Text;
  };

  // Constants
  private let FIXED_RECEIPT_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  private let REWARD_AMOUNT_USD = 2.0; // $2 reward per successful transaction
  private let TRANSACTION_EXPIRY_MINUTES = 30; // 30 minutes expiry

  // Stable Storage
  private stable var transactions_stable : [(TransactionId, Transaction)] = [];
  private stable var nextTransactionId_stable : Nat = 1;
  private stable var userTransactions_stable : [(Text, [TransactionId])] = [];
  private stable var stats_stable : (Nat, Nat, Nat, Nat, Nat, Nat, Float) = (0, 0, 0, 0, 0, 0, 0.0);

  // Runtime Storage (loaded from stable memory)
  private var transactions : HashMap.HashMap<TransactionId, Transaction> = HashMap.HashMap<TransactionId, Transaction>(0, Text.equal, Text.hash);
  private var nextTransactionId : Nat = 1;
  private var userTransactions : HashMap.HashMap<Text, [TransactionId]> = HashMap.HashMap<Text, [TransactionId]>(0, Text.equal, Text.hash);
  private var stats : (Nat, Nat, Nat, Nat, Nat, Nat, Float) = (0, 0, 0, 0, 0, 0, 0.0);
  private var initialized : Bool = false;

  //=========================================================================

  // Initialize runtime storage
  private func initializeStorage() {
    if (not initialized) {
      if (transactions_stable.size() > 0) {
        // Load from stable memory
        transactions := HashMap.fromIter<TransactionId, Transaction>(
          transactions_stable.vals(),
          transactions_stable.size(),
          Text.equal,
          Text.hash,
        );
        nextTransactionId := nextTransactionId_stable;
        userTransactions := HashMap.fromIter<Text, [TransactionId]>(
          userTransactions_stable.vals(),
          userTransactions_stable.size(),
          Text.equal,
          Text.hash,
        );
        stats := stats_stable;
      };
      initialized := true;
    };
  };

  // Manual save to stable memory (for testing and manual persistence)
  public func saveToStableMemory() : async () {
    transactions_stable := Iter.toArray(transactions.entries());
    nextTransactionId_stable := nextTransactionId;
    userTransactions_stable := Iter.toArray(userTransactions.entries());
    stats_stable := stats;
  };

  // Load from stable memory (for testing and manual loading)
  public func loadFromStableMemory() : async () {
    transactions := HashMap.fromIter<TransactionId, Transaction>(
      transactions_stable.vals(),
      transactions_stable.size(),
      Text.equal,
      Text.hash,
    );
    nextTransactionId := nextTransactionId_stable;
    userTransactions := HashMap.fromIter<Text, [TransactionId]>(
      userTransactions_stable.vals(),
      userTransactions_stable.size(),
      Text.equal,
      Text.hash,
    );
    stats := stats_stable;
  };

  // Helper functions
  private func generateTransactionId() : TransactionId {
    let id = "tx_" # Nat.toText(nextTransactionId);
    nextTransactionId += 1;
    return id;
  };

  private func getExpiryTime() : Time.Time {
    Time.now() + (TRANSACTION_EXPIRY_MINUTES * 60 * 1_000_000_000); // Convert minutes to nanoseconds
  };

  private func isTransactionExpired(transaction : Transaction) : Bool {
    Time.now() > (transaction.createdAt + (TRANSACTION_EXPIRY_MINUTES * 60 * 1_000_000_000));
  };

  private func getDepositAddress(chain : ChainType, userAddress : Text) : Text {
    // In a real implementation, this would generate a unique deposit address
    // For now, we'll use the user's address as the deposit address
    switch (chain) {
      case (#ETH) { userAddress };
      case (#BTC) { "btc_" # userAddress };
      case (#SOL) { "sol_" # userAddress };
      case (#POLYGON) { userAddress };
      case (#ARBITRUM) { userAddress };
      case (#OPTIMISM) { userAddress };
    };
  };

  private func getMinConfirmations(chain : ChainType) : Nat {
    switch (chain) {
      case (#ETH) { 1 };
      case (#BTC) { 3 };
      case (#SOL) { 1 };
      case (#POLYGON) { 1 };
      case (#ARBITRUM) { 1 };
      case (#OPTIMISM) { 1 };
    };
  };

  private func getExplorerUrl(chain : ChainType, txHash : Text) : Text {
    switch (chain) {
      case (#ETH) { "https://etherscan.io/tx/" # txHash };
      case (#BTC) { "https://www.blockchain.com/btc/tx/" # txHash };
      case (#SOL) { "https://solscan.io/tx/" # txHash };
      case (#POLYGON) { "https://polygonscan.com/tx/" # txHash };
      case (#ARBITRUM) { "https://arbiscan.io/tx/" # txHash };
      case (#OPTIMISM) { "https://optimistic.etherscan.io/tx/" # txHash };
    };
  };

  // User transaction management
  private func addUserTransaction(userAddress : Text, transactionId : TransactionId) {
    switch (userTransactions.get(userAddress)) {
      case (null) {
        userTransactions.put(userAddress, [transactionId]);
      };
      case (?existingIds) {
        let updatedIds = Array.append<TransactionId>(existingIds, [transactionId]);
        userTransactions.put(userAddress, updatedIds);
      };
    };
  };

  private func updateStats(transaction : Transaction, oldStatus : ?TransactionStatus) {
    let (total, pending, confirmed, rewardSent, failed, expired, totalReward) = stats;

    // Calculate new values without mutating the original variables
    var newTotal = total;
    var newPending = pending;
    var newConfirmed = confirmed;
    var newRewardSent = rewardSent;
    var newFailed = failed;
    var newExpired = expired;
    var newTotalReward = totalReward;

    // Remove old status from stats if it exists
    switch (oldStatus) {
      case (null) {};
      case (?status) {
        switch (status) {
          case (#PENDING) { newPending -= 1 };
          case (#CONFIRMED) { newConfirmed -= 1 };
          case (#REWARD_SENT) {
            newRewardSent -= 1;
            newTotalReward -= REWARD_AMOUNT_USD;
          };
          case (#FAILED) { newFailed -= 1 };
          case (#EXPIRED) { newExpired -= 1 };
        };
      };
    };

    // Add new status to stats
    switch (transaction.status) {
      case (#PENDING) {
        newPending += 1;
        if (oldStatus == null) { newTotal += 1 };
      };
      case (#CONFIRMED) {
        newConfirmed += 1;
        if (oldStatus == null) { newTotal += 1 };
      };
      case (#REWARD_SENT) {
        newRewardSent += 1;
        newTotalReward += REWARD_AMOUNT_USD;
        if (oldStatus == null) { newTotal += 1 };
      };
      case (#FAILED) {
        newFailed += 1;
        if (oldStatus == null) { newTotal += 1 };
      };
      case (#EXPIRED) {
        newExpired += 1;
        if (oldStatus == null) { newTotal += 1 };
      };
    };

    stats := (newTotal, newPending, newConfirmed, newRewardSent, newFailed, newExpired, newTotalReward);
  };

  // Public functions
  public func requestDeposit(request : FundingRequest) : async FundingResponse {
    try {
      // Initialize storage if not already done
      initializeStorage();

      let transactionId = generateTransactionId();
      let depositAddress = getDepositAddress(request.chain, request.userAddress);
      let minConfirmations = getMinConfirmations(request.chain);
      let expiresAt = getExpiryTime();

      let transaction : Transaction = {
        id = transactionId;
        userAddress = request.userAddress;
        depositAddress = depositAddress;
        chain = request.chain;
        amount = request.amount;
        status = #PENDING;
        createdAt = Time.now();
        confirmedAt = null;
        rewardSentAt = null;
        fundingTxHash = null;
        rewardTxHash = null;
        explorerUrl = null;
      };

      // Store transaction and update user mapping
      transactions.put(transactionId, transaction);
      addUserTransaction(request.userAddress, transactionId);
      updateStats(transaction, null);

      #Success({
        transactionId = transactionId;
        depositAddress = depositAddress;
        qrData = depositAddress;
        expiresAt = expiresAt;
        minConfirmations = minConfirmations;
      });
    } catch (e) {
      #Error("Failed to create deposit request: " # Error.message(e));
    };
  };

  public func checkStatus(transactionId : TransactionId) : async StatusResponse {
    // Initialize storage if not already done
    initializeStorage();

    switch (transactions.get(transactionId)) {
      case (null) {
        #Error("Transaction not found");
      };
      case (?transaction) {
        if (isTransactionExpired(transaction) and transaction.status == #PENDING) {
          // Mark as expired
          let expiredTransaction = {
            transaction with status = #EXPIRED;
          };
          transactions.put(transactionId, expiredTransaction);
          updateStats(expiredTransaction, ?transaction.status);

          #Success({
            status = #EXPIRED;
            confirmations = 0;
            fundedAmount = null;
            fundingTxHash = null;
            rewardTxHash = null;
            explorerUrl = null;
          });
        } else {
          // Simulate transaction progression for demo
          let (newStatus, confirmations, fundedAmount, fundingTxHash, rewardTxHash) = simulateTransactionProgression(transaction);

          let updatedTransaction = {
            transaction with
            status = newStatus;
            confirmedAt = if (newStatus == #CONFIRMED or newStatus == #REWARD_SENT) ?Time.now() else transaction.confirmedAt;
            rewardSentAt = if (newStatus == #REWARD_SENT) ?Time.now() else transaction.rewardSentAt;
            fundingTxHash = fundingTxHash;
            rewardTxHash = rewardTxHash;
            explorerUrl = if (Option.isSome(fundingTxHash)) ?getExplorerUrl(transaction.chain, Option.unwrap(fundingTxHash)) else null;
          };

          transactions.put(transactionId, updatedTransaction);
          updateStats(updatedTransaction, ?transaction.status);

          #Success({
            status = newStatus;
            confirmations = confirmations;
            fundedAmount = fundedAmount;
            fundingTxHash = fundingTxHash;
            rewardTxHash = rewardTxHash;
            explorerUrl = if (Option.isSome(fundingTxHash)) ?getExplorerUrl(transaction.chain, Option.unwrap(fundingTxHash)) else null;
          });
        };
      };
    };
  };

  private func simulateTransactionProgression(transaction : Transaction) : (TransactionStatus, Nat, ?Float, ?Text, ?Text) {
    // Simulate different stages of transaction processing
    let currentTime = Time.now();
    let randomValue = Int.abs(currentTime % 100);

    if (randomValue < 20) {
      // 20% chance - still pending
      (#PENDING, 0, null, null, null);
    } else if (randomValue < 60) {
      // 40% chance - confirmed but no reward sent yet
      let dummyTxHash = "0x" # Nat.toText(Int.abs(currentTime % 1000000));
      (#CONFIRMED, getMinConfirmations(transaction.chain), ?transaction.amount, ?dummyTxHash, null);
    } else if (randomValue < 90) {
      // 30% chance - reward sent
      let fundingTxHash = "0x" # Nat.toText(Int.abs(currentTime % 1000000));
      let rewardTxHash = "0x" # Nat.toText(Int.abs((currentTime + 1) % 1000000));
      (#REWARD_SENT, getMinConfirmations(transaction.chain), ?transaction.amount, ?fundingTxHash, ?rewardTxHash);
    } else {
      // 10% chance - failed
      (#FAILED, 0, null, null, null);
    };
  };

  public func sendReward(transactionId : TransactionId) : async Result.Result<Text, Text> {
    // Initialize storage if not already done
    initializeStorage();

    switch (transactions.get(transactionId)) {
      case (null) {
        #err("Transaction not found");
      };
      case (?transaction) {
        if (transaction.status != #CONFIRMED) {
          #err("Transaction not confirmed yet");
        } else {
          // Calculate reward amount (2% of transaction amount, minimum $2)
          let rewardAmount = if (transaction.amount >= 100) {
            transaction.amount * 0.02 // 2% for amounts >= $100
          } else {
            2.0 // $2 minimum reward
          };
          
          // Simulate sending reward to fixed receipt address
          let rewardTxHash = "reward_" # Nat.toText(Int.abs(Time.now() % 1000000)) # "_" # Float.toText(rewardAmount);

          let updatedTransaction = {
            transaction with
            status = #REWARD_SENT;
            rewardSentAt = ?Time.now();
            rewardTxHash = ?rewardTxHash;
          };

          transactions.put(transactionId, updatedTransaction);
          updateStats(updatedTransaction, ?transaction.status);

          Debug.print("Reward of $" # Float.toText(REWARD_AMOUNT_USD) # " sent to " # FIXED_RECEIPT_ADDRESS);
          #ok("Reward sent successfully to " # FIXED_RECEIPT_ADDRESS);
        };
      };
    };
  };

  public func getTransaction(transactionId : TransactionId) : async ?Transaction {
    // Initialize storage if not already done
    initializeStorage();
    return transactions.get(transactionId);
  };

  public func getAllTransactions() : async [Transaction] {
    // Initialize storage if not already done
    initializeStorage();

    let transactionArray = Array.init<Transaction>(
      transactions.size(),
      {
        id = "";
        userAddress = "";
        depositAddress = "";
        chain = #ETH;
        amount = 0.0;
        status = #PENDING;
        createdAt = 0;
        confirmedAt = null;
        rewardSentAt = null;
        fundingTxHash = null;
        rewardTxHash = null;
        explorerUrl = null;
      },
    );

    var index = 0;
    for ((_, transaction) in transactions.entries()) {
      transactionArray[index] := transaction;
      index += 1;
    };

    Array.freeze(transactionArray);
  };

  public func getTransactionsByUser(userAddress : Text) : async [Transaction] {
    // Initialize storage if not already done
    initializeStorage();

    switch (userTransactions.get(userAddress)) {
      case (null) { [] };
      case (?transactionIds) {
        let userTransactionList = Array.filter<Transaction>(
          Array.map<TransactionId, ?Transaction>(
            transactionIds,
            func(id) = transactions.get(id),
          ),
          func(optTx) = Option.isSome(optTx),
        );
        let userTransactionList = Array.map<?Transaction, Transaction>(
          userTransactionList,
          func(optTx) = Option.unwrap(optTx),
        );
        userTransactionList;
      };
    };
  };

  public func getTransactionStats() : async {
    totalTransactions : Nat;
    pendingTransactions : Nat;
    confirmedTransactions : Nat;
    rewardSentTransactions : Nat;
    failedTransactions : Nat;
    expiredTransactions : Nat;
    totalRewardAmount : Float;
  } {
    // Initialize storage if not already done
    initializeStorage();

    let (total, pending, confirmed, rewardSent, failed, expired, totalReward) = stats;

    {
      totalTransactions = total;
      pendingTransactions = pending;
      confirmedTransactions = confirmed;
      rewardSentTransactions = rewardSent;
      failedTransactions = failed;
      expiredTransactions = expired;
      totalRewardAmount = totalReward;
    };
  };

  public func getFixedReceiptAddress() : async Text {
    FIXED_RECEIPT_ADDRESS;
  };

  // Get the fixed receipt address for the send form
  public query func getReceiptAddress() : async Text {
    FIXED_RECEIPT_ADDRESS;
  };

  public func getRewardAmount() : async Float {
    REWARD_AMOUNT_USD;
  };

  // Debug function to get storage status
  public func getStorageStatus() : async {
    initialized : Bool;
    transactionCount : Nat;
    userCount : Nat;
    nextId : Nat;
  } {
    initializeStorage();
    {
      initialized = initialized;
      transactionCount = transactions.size();
      userCount = userTransactions.size();
      nextId = nextTransactionId;
    };
  };

  // Admin functions
  // public func clearExpiredTransactions() : async Nat {
  //   // Initialize storage if not already done
  //   initializeStorage();

  //   var clearedCount = 0;
  //   let expiredIds = Array.filter<TransactionId>(
  //     Array.fromIter(transactions.keys()),
  //     func(id) = switch (transactions.get(id)) {
  //       case (null) { false };
  //       case (?transaction) {
  //         isTransactionExpired(transaction) and transaction.status == #EXPIRED;
  //       };
  //     },
  //   );

  //   for (id in expiredIds.vals()) {
  //     switch (transactions.get(id)) {
  //       case (null) {};
  //       case (?transaction) {
  //         // Remove from user transactions mapping
  //         switch (userTransactions.get(transaction.userAddress)) {
  //           case (null) {};
  //           case (?userTxIds) {
  //             let filteredIds = Array.filter<TransactionId>(
  //               userTxIds,
  //               func(txId) = txId != id,
  //             );
  //             if (filteredIds.size() == 0) {
  //               userTransactions.delete(transaction.userAddress);
  //             } else {
  //               userTransactions.put(transaction.userAddress, filteredIds);
  //             };
  //           };
  //         };

  //         // Update stats (remove from stats since we're deleting)
  //         let (total, pending, confirmed, rewardSent, failed, expired, totalReward) = stats;
  //         let newStats = switch (transaction.status) {
  //           case (#PENDING) {
  //             (total - 1, pending - 1, confirmed, rewardSent, failed, expired, totalReward);
  //           };
  //           case (#CONFIRMED) {
  //             (total - 1, pending, confirmed - 1, rewardSent, failed, expired, totalReward);
  //           };
  //           case (#REWARD_SENT) {
  //             (total - 1, pending, confirmed, rewardSent - 1, failed, expired, totalReward - REWARD_AMOUNT_USD);
  //           };
  //           case (#FAILED) {
  //             (total - 1, pending, confirmed, rewardSent, failed - 1, expired, totalReward);
  //           };
  //           case (#EXPIRED) {
  //             (total - 1, pending, confirmed, rewardSent, failed, expired - 1, totalReward);
  //           };
  //         };
  //         stats := newStats;

  //         // Remove transaction
  //         transactions.delete(id);
  //         clearedCount += 1;
  //       };
  //     };
  //   };

  //   clearedCount;
  // };

  public func resetAllTransactions() : async () {
    // Initialize storage if not already done
    initializeStorage();

    transactions := HashMap.HashMap<TransactionId, Transaction>(0, Text.equal, Text.hash);
    userTransactions := HashMap.HashMap<Text, [TransactionId]>(0, Text.equal, Text.hash);
    nextTransactionId := 1;
    stats := (0, 0, 0, 0, 0, 0, 0.0);
  };
  //========================================
  // Data Persistence for Upgrades
  //========================================

  system func preupgrade() {
    generalInquiryEntries := Iter.toArray(generalInquiries.entries());
    consultancyBookingEntries := Iter.toArray(consultancyBookings.entries());
    projectDevelopmentEntries := Iter.toArray(projectDevelopments.entries());
    reviewEntries := Iter.toArray(reviews.entries());
    subscriptionEntries := Iter.toArray(subscriptions.entries());
    // append to your existing preupgrade body:
    blogEntries := Iter.toArray(blogs.entries());
    slugIndexEntries := Iter.toArray(slugIndex.entries());
    // Save current state to stable memory before upgrade
    transactions_stable := Iter.toArray(transactions.entries());
    nextTransactionId_stable := nextTransactionId;
    userTransactions_stable := Iter.toArray(userTransactions.entries());
    stats_stable := stats;

  };

  system func postupgrade() {
    generalInquiries := HashMap.fromIter<Text, GeneralInquiry>(generalInquiryEntries.vals(), 1, Text.equal, Text.hash);
    consultancyBookings := HashMap.fromIter<Text, ConsultancyBooking>(consultancyBookingEntries.vals(), 1, Text.equal, Text.hash);
    projectDevelopments := HashMap.fromIter<Text, ProjectDevelopment>(projectDevelopmentEntries.vals(), 1, Text.equal, Text.hash);
    reviews := HashMap.fromIter<Text, Review>(reviewEntries.vals(), 1, Text.equal, Text.hash);
    subscriptions := HashMap.fromIter<Text, Subscription>(subscriptionEntries.vals(), 1, Text.equal, Text.hash);
    // append to your existing postupgrade body:
    blogs := HashMap.fromIter<Text, Blog>(blogEntries.vals(), 1, Text.equal, Text.hash);
    slugIndex := HashMap.fromIter<Text, Text>(slugIndexEntries.vals(), 1, Text.equal, Text.hash);

    // optional hygiene
    blogEntries := [];
    slugIndexEntries := [];

    // Load state from stable memory after upgrade
    transactions := HashMap.fromIter<TransactionId, Transaction>(
      transactions_stable.vals(),
      transactions_stable.size(),
      Text.equal,
      Text.hash,
    );
    nextTransactionId := nextTransactionId_stable;
    userTransactions := HashMap.fromIter<Text, [TransactionId]>(
      userTransactions_stable.vals(),
      userTransactions_stable.size(),
      Text.equal,
      Text.hash,
    );
    stats := stats_stable;

    // Clear stable arrays to free memory
    transactions_stable := [];
    userTransactions_stable := [];
  };
};
