import { FreshContext } from "$fresh/server.ts";
import type { PostState } from "lib/state.ts";
import { supabase } from "lib/db.ts";
import { getReadableTime } from "lib/readable_time.ts";
import { getPostVotes } from "lib/get_post_votes.ts";
import { CommentVote } from "islands/CommentVote.tsx";
import { CreateComment } from "islands/CreateComment.tsx";
import { Comment } from "islands/Comment.tsx";
import { Post } from "islands/Post.tsx";

export default async function Dashboard(
  req: Request,
  ctx: FreshContext<PostState>,
) {
  const post = ctx.state.post;
  const votes = await getPostVotes(post.id);

  // Get comments
  const { data: commentData } = await supabase
    .from("comments")
    .select("*, member_id!inner(*, user_id!inner(*)), parent_id")
    .eq("post_id", post.id);

  const comments = commentData as unknown as {
    id: number;
    content: string;
    created_at: string;
    member_id: { user_id: { name: string; picture: string } };
    parent_id: number;
    // deno-lint-ignore no-explicit-any
    children: any[];
  }[];

  // deno-lint-ignore no-explicit-any
  function buildTree(comments: any, parent: any) {
    const tree = [];

    for (const comment of comments) {
      if (comment.parent_id === parent) {
        const children = buildTree(comments, comment.id);

        if (children.length) {
          comment.children = children;
        }

        tree.push(comment);
      }
    }

    return tree;
  }

  // Build a comment tree
  const commentForest = buildTree(comments, null);

  const commentVotesPromises = comments!.map(async (comment) => {
    const { count: upvoteCountComment } = await supabase
      .from("votes")
      .select("*", { count: "exact" })
      .eq("upvote", true)
      .eq("comment_id", comment.id);

    const { count: downvoteCountComment } = await supabase
      .from("votes")
      .select("*", { count: "exact" })
      .eq("upvote", false)
      .eq("comment_id", comment.id);
    const votesComment = (upvoteCountComment ?? 0) -
      (downvoteCountComment ?? 0);

    return votesComment;
  });

  const votesComments = await Promise.all(commentVotesPromises);

  //Checked the voted state
  const { data } = await supabase.from("votes").select("*").eq(
    "member_id",
    ctx.state.member.id,
  ).eq("post_id", post.id);
  const voted = data === null || data.length === 0
    ? 0
    : (data[0].upvote ? 1 : -1);

  const postedBy = post.anonymous ? "Anonymous" : ctx.state.user.name;

  // deno-lint-ignore no-explicit-any
  function renderComment(comment: any, index: any) {
    return (
      <div
        class={`px-4 py-2 flex p-4 ${
          comment.parent_id ? "pl-4 border-l-2 border-gray-400" : ""
        }`}
      >
        <img
          class="rounded-full w-6 h-6"
          src={comment.member_id.user_id.picture}
        />
        <div class="flex flex-col gap-2">
          <p class="text-zinc-400 text-xs">
            <span class="text-black font-bold">
              {comment.member_id.user_id.name}
            </span>{" "}
            · {getReadableTime(comment.created_at)}
          </p>
          <p>{comment.content}</p>
          <div class="flex gap-4">
            <CommentVote
              votes={votesComments[index]}
              voted={voted}
              commentId={comment.id}
            />
          </div>
          <div class={` ${comment.parent_id ? "pl-1" : ""}`}>
            <Comment
              post_id={ctx.params.postId}
              classId={ctx.params.classId}
              commentId={comment.id}
            />
          </div>
          {comment.children &&
            comment.children.map(renderComment)}
        </div>
      </div>
    );
  }
  const { data: tagData } = await supabase.from("post_tags").select(
    "*, tag_id!inner(*)",
  ).eq("post_id", post.id);
  const tags = tagData as unknown as {
    tag_id: {
      tag: string;
    };
  }[];
  return (
    <div class="w-full h-full p-4 flex flex-col overflow-hidden overflow-y-auto">
      <Post
        pinned={post.pinned}
        classId={ctx.state.class.id}
        isAuthor={post.member_id === ctx.state.member.id}
        isTeacher={ctx.state.member.role !== "student"}
        createdAt={post.created_at}
        votes={votes}
        voted={voted}
        postId={post.id}
        title={post.title}
        content={post.content}
        tags={tags}
        postedBy={postedBy}
      />
      <CreateComment post_id={ctx.params.postId} classId={ctx.params.classId} />
      {commentForest && commentForest.map(renderComment)}
    </div>
  );
}
