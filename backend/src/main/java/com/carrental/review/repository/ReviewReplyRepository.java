package com.carrental.review.repository;

import com.carrental.review.entity.ReviewReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {

    List<ReviewReply> findByReviewIdOrderByCreatedAtAscIdAsc(Long reviewId);

    boolean existsByReviewIdAndAuthorRole(Long reviewId, com.carrental.review.entity.ReviewReplyAuthorRole authorRole);
}
