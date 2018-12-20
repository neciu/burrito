import dispatchCommand, {
  getBurritoDialog,
  getQuesadillaDialog,
  getSmallBurritoDialog,
  getSmallQuesadillaDialog,
} from "dispatchCommand";

export async function handleActions(ctx) {
  const payload = JSON.parse(ctx.request.body.payload);

  console.info(payload);

  let result = {};
  if (payload.type === "interactive_message") {
    if (
      payload.callback_id === "item_order" &&
      payload.actions[0].value === "burrito"
    ) {
      result = await dispatchCommand({
        command: "showBurritoDialog",
        triggerId: payload.trigger_id,
        dialog: getBurritoDialog(payload.callback_id),
      });
    } else if (
      payload.callback_id === "item_order" &&
      payload.actions[0].value === "burrito-small"
    ) {
      result = await dispatchCommand({
        command: "showSmallBurritoDialog",
        triggerId: payload.trigger_id,
        dialog: getSmallBurritoDialog(payload.callback_id),
      });
    } else if (
      payload.callback_id === "item_order" &&
      payload.actions[0].value === "quesadilla"
    ) {
      result = await dispatchCommand({
        command: "showQuesadillaDialog",
        triggerId: payload.trigger_id,
        dialog: getQuesadillaDialog(payload.callback_id),
      });
    } else if (
      payload.callback_id === "item_order" &&
      payload.actions[0].value === "quesadilla-small"
    ) {
      result = await dispatchCommand({
        command: "showSmallQuesadillaDialog",
        triggerId: payload.trigger_id,
        dialog: getSmallQuesadillaDialog(payload.callback_id),
      });
    } else {
      console.error(
        "Unsupported interactive message with callback_id: ",
        payload.callback_id,
      );
      console.error("Full body: ", ctx.request.body);
    }
  } else if (payload.type === "dialog_submission") {
    switch (payload.callback_id) {
      case "item_order": {
        result = await dispatchCommand({
          command: "addOrderItem",
          userName: payload.user.name,
          orderItem: {
            type: payload.state,
            filling: payload.submission.filling,
            sauce: payload.submission.sauce,
            drink: payload.submission.drink,
          },
          responseUrl: payload.response_url,
        });
        break;
      }
      default: {
        console.error(
          "Unsupported dialog submission with callback_id: ",
          payload.callback_id,
        );
        console.error("Full body: ", ctx.request.body);
      }
    }
  } else {
    console.error("Unsupported action with type: ", payload.type);
    console.error("Full body: ", ctx.request.body);
  }

  ctx.status = 200;
  ctx.body = result;
}
