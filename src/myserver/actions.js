import dispatchCommand from "dispatchCommand";
import { CommandType } from "commands";
import OrderItemType from "OrderItemType";

export async function handleActions(ctx) {
  const payload = JSON.parse(ctx.request.body.payload);

  if (payload.type === "interactive_message") {
    await dispatchCommand({
      type: CommandType.show_order_item_dialog,
      itemType: payload.actions[0].value,
      triggerId: payload.trigger_id,
    });
  } else if (payload.type === "dialog_submission") {
    await dispatchCommand({
      type: CommandType.add_order_item,
      responseUrl: payload.response_url,
      userName: payload.user.id,
      item: {
        type: payload.state,
        filling: payload.submission.filling,
        sauce: payload.submission.sauce,
        drink: [
          OrderItemType.big_burrito,
          OrderItemType.double_quesadilla,
        ].includes(payload.state)
          ? payload.submission.drink
          : undefined,
        comments: payload.submission.comments,
      },
    });
  } else {
    const error = `Unsupported type: ${payload.type}`;
    console.error(new Error(error));
    ctx.status = 400;
    ctx.body = error;
  }

  ctx.status = 204;
}
